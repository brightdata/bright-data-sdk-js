import { request } from 'undici';
import { REQUEST_API_URL } from '../utils/constants';
import { safeJsonParse } from '../utils/misc';
import { getLogger, logRequest } from '../utils/logging-config';
import {
    ValidationError,
    APIError,
    AuthenticationError,
} from '../exceptions/errors';
import { getDispatcher, isResponseOk } from '../utils/net';
import { getAuthHeaders } from '../utils/auth';
import { ZoneNameSchema } from '../schemas';
import type { ScrapeOptions } from '../types';
import type { ZoneManager } from '../utils/zone-manager';

const logger = getLogger('api.scraper');

interface WebScraperOptions {
    apiKey: string;
    zoneManager: ZoneManager;
    autoCreateZones?: boolean;
    zone?: string;
}

export class WebScraper {
    private authHeaders: ReturnType<typeof getAuthHeaders>;
    private zone?: string;
    private zoneManager: ZoneManager;

    constructor(opts: WebScraperOptions) {
        this.zone = opts.zone;
        this.authHeaders = getAuthHeaders(opts.apiKey);
        this.zoneManager = opts.zoneManager;
    }

    async scrape(url: string | string[], opt: ScrapeOptions = {}) {
        ZoneNameSchema.parse(opt.zone || this.zone);

        if (Array.isArray(url)) {
            logger.info(
                `Starting batch scraping operation for ${url.length} URLs`,
            );
            return this.scrapeBatch(url, opt);
        }

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
                headers: this.authHeaders,
                dispatcher: getDispatcher({ timeout }),
            });

            const response_data = await response.body.text();

            if (response.statusCode >= 400) {
                if (response.statusCode === 401) {
                    throw new AuthenticationError(
                        'Invalid API key or insufficient permissions',
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
                headers: this.authHeaders,
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
