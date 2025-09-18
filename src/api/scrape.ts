import { request } from 'undici';
import { REQUEST_API_URL } from '../utils/constants';
import {
    validateUrl,
    validateZoneName,
    validateCountryCode,
    validateTimeout,
    validateUrlList,
    validateResponseFormat,
    validateHttpMethod,
    validateResponseSize,
} from '../utils/validation';
import { safeJsonParse } from '../utils/misc';
import { getLogger, logRequest } from '../utils/logging-config';
import {
    ValidationError,
    APIError,
    AuthenticationError,
} from '../exceptions/errors';
import { getDispatcher, isResponseOk } from '../utils/net';
import { getAuthHeaders } from '../utils/auth';
import type { ScrapeOptions } from '../types';

const logger = getLogger('api.scraper');

export class WebScraper {
    private api_token: string;

    constructor(api_token: string) {
        this.api_token = api_token;
    }

    async scrape(url: string | string[], opt: ScrapeOptions = {}) {
        if (Array.isArray(url)) {
            validateUrlList(url);
            logger.info(
                `Starting batch scraping operation for ${url.length} URLs`,
            );
            return this.scrapeBatch(url, opt);
        }

        validateUrl(url);
        validateZoneName(opt.zone);
        validateResponseFormat(opt.responseFormat);
        validateHttpMethod(opt.method);
        validateCountryCode(opt.country);
        validateTimeout(opt.timeout);

        logger.info(`Starting single URL scraping: ${url}`);

        return this.scrapeSingle(url, opt);
    }

    private async scrapeSingle(url: string, opt: ScrapeOptions = {}) {
        const {
            zone,
            responseFormat = 'raw',
            method = 'GET',
            country = '',
            dataFormat = 'markdown',
            timeout = null,
        } = opt;

        const requestData: Record<string, unknown> = {
            url,
            zone,
            format: responseFormat,
            method: method.toUpperCase(),
            country: country.toLowerCase(),
            data_format: dataFormat,
        };

        Object.keys(requestData).forEach((key) => {
            if (!requestData[key]) {
                delete requestData[key];
            }
        });

        logRequest('POST', REQUEST_API_URL, requestData);

        try {
            const response = await request(REQUEST_API_URL, {
                method: 'POST',
                body: JSON.stringify(requestData),
                headers: getAuthHeaders(this.api_token),
                dispatcher: getDispatcher({ timeout }),
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

            if (responseFormat === 'json') {
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

    private async scrapeBatch(urls: string[], opt: ScrapeOptions = {}) {
        logger.info(`Processing ${urls.length} URLs in parallel`);

        const {
            zone,
            responseFormat = 'raw',
            method = 'GET',
            country = '',
            dataFormat = 'markdown',
        } = opt;

        const requests = urls.map((url) => {
            const requestBody: Record<string, unknown> = {
                zone,
                url,
                format: responseFormat,
                method: method.toUpperCase(),
                data_format: dataFormat,
            };

            if (country) {
                requestBody.country = country.toLowerCase();
            }

            return request(REQUEST_API_URL, {
                method: 'POST',
                headers: getAuthHeaders(this.api_token),
                body: JSON.stringify(requestBody),
                dispatcher: getDispatcher(),
            });
        });

        try {
            const responses = await Promise.all(requests);

            const results = [];
            for (let i = 0; i < responses.length; i++) {
                const response = responses[i];
                const url = urls[i];

                try {
                    if (!isResponseOk(response)) {
                        results.push({
                            error: `HTTP ${response.statusCode}`,
                            url: url,
                        });
                        continue;
                    }

                    let data;
                    if (responseFormat === 'json') {
                        data = await response.body.json();
                    } else {
                        data = await response.body.text();
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
}
