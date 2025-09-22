import { PromisePool } from '@supercharge/promise-pool';
import { REQUEST_API_URL, DEFAULT_CONCURRENCY } from '../utils/constants';
import { getLogger, logRequest } from '../utils/logging-config';
import {
    ValidationError,
    APIError,
    AuthenticationError,
    BRDError,
} from '../utils/errors';
import { request, getDispatcher } from '../utils/net';
import { getAuthHeaders } from '../utils/auth';
import { dropEmptyKeys, safeJsonParse } from '../utils/misc';
import { ZoneNameSchema } from '../schemas';
import type { ScrapeOptions, JSONResponse } from '../types';
import type { ZoneManager } from '../utils/zone-manager';

const logger = getLogger('api.scraper');

interface ScrapeQueryBody {
    url: string;
    zone: ScrapeOptions['zone'];
    format: ScrapeOptions['format'];
    method?: ScrapeOptions['method'];
    country?: ScrapeOptions['country'];
    data_format?: ScrapeOptions['dataFormat'];
}

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
        const zone = ZoneNameSchema.parse(opt.zone || this.zone);

        if (Array.isArray(url)) {
            logger.info(
                `Starting batch scraping operation for ${url.length} URLs`,
            );
            return this.scrapeBatch(url, zone, opt);
        }

        logger.info(`Starting single URL scraping: ${url}`);

        return this.scrapeSingle(url, zone, opt);
    }
    private async scrapeSingle(
        url: string,
        zone: string,
        opt: ScrapeOptions = {},
    ) {
        const requestData: ScrapeQueryBody = {
            url,
            zone,
            method: opt.method,
            country: opt.country,
            format: opt.format || 'raw',
            data_format: opt.dataFormat || 'markdown',
        };

        dropEmptyKeys(requestData);
        logRequest('POST', REQUEST_API_URL, requestData);

        try {
            const response = await request(REQUEST_API_URL, {
                method: 'POST',
                body: JSON.stringify(requestData),
                headers: this.authHeaders,
                dispatcher: getDispatcher({ timeout: opt.timeout }),
            });

            const responseTxt = await response.body.text();

            if (response.statusCode >= 400) {
                if (response.statusCode === 401) {
                    throw new AuthenticationError(
                        'Invalid API key or insufficient permissions',
                    );
                }
                if (response.statusCode === 400) {
                    throw new ValidationError(`Bad request: ${responseTxt}`);
                }
                throw new APIError(
                    `Scraping failed: HTTP ${response.statusCode}`,
                    response.statusCode,
                    responseTxt,
                );
            }

            if (opt.format === 'json') {
                return safeJsonParse(responseTxt);
            }

            return responseTxt;
        } catch (e: any) {
            if (e instanceof BRDError) throw e;
            throw new APIError(`Scraping failed: ${e.message}`);
        }
    }

    private async scrapeBatch(
        urls: string[],
        zone: string,
        opt: ScrapeOptions = {},
    ) {
        const limit = opt.concurrency || DEFAULT_CONCURRENCY;
        logger.info(`Processing ${urls.length} URLs in parallel`);
        logger.info(`Concurrency is ${limit}`);

        try {
            const { results } = await PromisePool.for(urls)
                .withConcurrency(limit)
                .useCorrespondingResults()
                .process(async (url) => {
                    try {
                        return await this.scrapeSingle(url, zone, opt);
                    } catch (e) {
                        return e;
                    }
                });

            logger.info(
                `Completed batch scraping operation: ${results.length} results`,
            );

            return results;
        } catch (error: any) {
            logger.error(`Batch scraping failed: ${error.message}`);
            throw new APIError(`Batch scraping failed:`, error.message);
        }
    }
}
