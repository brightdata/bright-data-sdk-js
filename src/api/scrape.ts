import { request } from 'undici';
import deasync from 'deasync';
import { REQUEST_API_URL } from '../utils/constants';
import {
    validateUrl,
    validateZoneName,
    validateCountryCode,
    validateTimeout,
    validateUrlList,
    validateResponseFormat,
    validateHttpMethod,
    getLogger,
    logRequest,
    safeJsonParse,
    validateResponseSize,
} from '../utils';
import {
    ValidationError,
    APIError,
    AuthenticationError,
} from '../exceptions/errors';
import { getAuthHeaders } from '../utils/auth';
import type { ScrapeOptions } from '../types';

const logger = getLogger('api.scraper');

export class WebScraper {
    private api_token: string;
    private default_timeout: number;
    private max_retries: number;
    private retry_backoff: number;
    constructor(
        api_token: string,
        default_timeout = 30 * 1000,
        max_retries = 3,
        retry_backoff = 1.5,
    ) {
        this.api_token = api_token;
        this.default_timeout = default_timeout;
        this.max_retries = max_retries;
        this.retry_backoff = retry_backoff;
    }

    async scrape(url: string, opt: ScrapeOptions = {}) {
        const {
            zone,
            response_format = 'raw',
            method = 'GET',
            country = '',
            timeout = null,
        } = opt;

        if (Array.isArray(url)) {
            validateUrlList(url);
            logger.info(
                `Starting batch scraping operation for ${url.length} URLs`,
            );
            return this._scrape_batch(url, opt);
        }

        validateUrl(url);
        validateZoneName(zone);
        validateResponseFormat(response_format);
        validateHttpMethod(method);
        validateCountryCode(country);
        validateTimeout(timeout || this.default_timeout);

        logger.info(`Starting single URL scraping: ${url}`);
        return this._scrape_single(url, opt);
    }

    async _scrape_single(url: string, opt: ScrapeOptions = {}) {
        const {
            zone,
            response_format = 'raw',
            method = 'GET',
            country = '',
            data_format = 'markdown',
            timeout = null,
        } = opt;

        const request_data: Record<string, unknown> = {
            url,
            zone,
            format: response_format,
            method: method.toUpperCase(),
            country: country.toLowerCase(),
            data_format,
        };

        // Clean up empty values
        Object.keys(request_data).forEach((key) => {
            if (!request_data[key]) {
                delete request_data[key];
            }
        });

        logRequest('POST', REQUEST_API_URL, request_data);

        try {
            const response = await request(REQUEST_API_URL, {
                method: 'POST',
                body: JSON.stringify(request_data),
                timeout: timeout || this.default_timeout,
                headers: getAuthHeaders(this.api_token),
            });

            const response_data = await response.body.text();

            validateResponseSize(response_data);

            if (response.statusCode >= 400) {
                if (response.statusCode === 401) {
                    throw new AuthenticationError(
                        'Invalid API token or insufficient permissions',
                    );
                }
                if (response.statusCode === 400) {
                    throw new ValidationError(`Bad request: ${response_data}`);
                }
                throw new APIError(
                    `Scraping failed: HTTP ${response.statusCode}`,
                    response.statusCode,
                    response_data,
                );
            }

            if (response_format === 'json') {
                return safeJsonParse(response_data);
            }
            return response_data;
        } catch (e: any) {
            if (
                e instanceof AuthenticationError ||
                e instanceof ValidationError ||
                e instanceof APIError
            ) {
                throw e;
            }
            throw new APIError(`Scraping failed: ${e.message}`);
        }
    }

    async _scrape_batch_async(urls: string[], opt: ScrapeOptions = {}) {
        logger.info(`Processing ${urls.length} URLs in parallel`);

        // Create all fetch requests (exact pattern from successful test-promise-all.js)
        const requests = urls.map((url) => {
            const {
                zone,
                response_format = 'raw',
                method = 'GET',
                country = '',
                data_format = 'markdown',
            } = opt;

            const requestBody = {
                zone: zone,
                url: url,
                format: response_format,
                method: method.toUpperCase(),
                data_format: data_format,
            };

            if (country) {
                requestBody.country = country.toLowerCase();
            }

            return request(REQUEST_API_URL, {
                method: 'POST',
                headers: getAuthHeaders(this.api_token),
                body: JSON.stringify(requestBody),
            });
        });

        try {
            // Wait for all requests in parallel (exact pattern from test-promise-all.js)
            const responses = await Promise.all(requests);

            // Process all responses
            const results = [];
            for (let i = 0; i < responses.length; i++) {
                const response = responses[i];
                const url = urls[i];

                try {
                    if (!response.ok) {
                        results.push({
                            error: `HTTP ${response.status}`,
                            url: url,
                        });
                        continue;
                    }

                    let data;
                    if (opt.response_format === 'json') {
                        data = await response.json();
                    } else {
                        data = await response.text();
                    }

                    results.push(data);
                    logger.debug(`Completed scraping URL: ${url}`);
                } catch (error: any) {
                    logger.error(
                        `Failed to process URL: ${url} - ${error.message}`,
                    );
                    results.push({ error: error.message, url: url });
                }
            }

            logger.info(
                `Completed batch scraping operation: ${results.length} results`,
            );
            return results;
        } catch (error: any) {
            logger.error(`Batch scraping failed: ${error.message}`);
            return urls.map((url) => ({ error: error.message, url: url }));
        }
    }

    async _scrape_batch(urls: string[], opt: ScrapeOptions = {}) {
        // Optimize batch processing using Promise.allSettled for better performance
        logger.info(
            `Processing ${urls.length} URLs with optimized parallel requests`,
        );

        const {
            zone,
            response_format = 'raw',
            method = 'GET',
            country = '',
            data_format = 'markdown',
            timeout = null,
        } = opt;

        // Create all requests at once using native fetch for better performance
        const requests = urls.map((url) => {
            const requestBody = {
                zone: zone,
                url: url,
                format: response_format,
                method: method.toUpperCase(),
                data_format: data_format,
            };

            if (country) {
                requestBody.country = country.toLowerCase();
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(
                () => controller.abort(),
                timeout || this.default_timeout,
            );

            return request(REQUEST_API_URL, {
                method: 'POST',
                headers: getAuthHeaders(this.api_token),
                body: JSON.stringify(requestBody),
                signal: controller.signal,
            })
                .then(async (response) => {
                    clearTimeout(timeoutId);
                    if (!response.ok) {
                        return { error: `HTTP ${response.status}`, url: url };
                    }

                    let data;
                    if (response_format === 'json') {
                        data = await response.json();
                    } else {
                        data = await response.text();
                    }
                    return data;
                })
                .catch((error) => {
                    clearTimeout(timeoutId);
                    return {
                        error: error.message,
                        url: url,
                    };
                });
        });

        let isDone = false;
        let results = null;

        Promise.all(requests)
            .then((res) => {
                results = res;
                isDone = true;
            })
            .catch((err) => {
                results = urls.map((url) => ({ error: err.message, url: url }));
                isDone = true;
            });

        deasync.loopWhile(() => !isDone);

        logger.info(
            `Completed optimized batch scraping: ${results.length} results`,
        );
        return results;
    }
}
