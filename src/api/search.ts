import { PromisePool } from '@supercharge/promise-pool';
import { REQUEST_API_URL, DEFAULT_CONCURRENCY } from '../utils/constants';
import { getLogger, logRequest } from '../utils/logging-config';
import { APIError, BRDError } from '../utils/errors';
import { request, getDispatcher, assertResponse } from '../utils/net';
import { getAuthHeaders } from '../utils/auth';
import { dropEmptyKeys, parseJSON } from '../utils/misc';
import { ZoneNameSchema } from '../schemas';
import type { SearchOptions, SearchEngine, JSONResponse } from '../types';
import type { ZoneManager } from '../utils/zone-manager';

const logger = getLogger('api.search');

interface SERPQueryBody {
    method: 'GET';
    url: string;
    zone: SearchOptions['zone'];
    format: SearchOptions['format'];
    country?: SearchOptions['country'];
    data_format?: 'markdown' | 'screenshot';
}

const toSEUrl = (searchEngine: SearchEngine = 'google', query: string) => {
    const encodedQuery = encodeURIComponent(query.trim());

    switch (searchEngine.toLowerCase()) {
        case 'bing':
            return `https://www.bing.com/search?q=${encodedQuery}`;
        case 'yandex':
            return `https://yandex.com/search/?text=${encodedQuery}`;
        case 'google':
        default:
            return `https://www.google.com/search?q=${encodedQuery}`;
    }
};

interface SearchAPIOptions {
    apiKey: string;
    zoneManager: ZoneManager;
    autoCreateZones?: boolean;
    zone?: string;
}

export class SearchAPI {
    private authHeaders: ReturnType<typeof getAuthHeaders>;
    private zoneManager: ZoneManager;
    private zone?: string;

    constructor(opts: SearchAPIOptions) {
        this.zone = opts.zone;
        this.authHeaders = getAuthHeaders(opts.apiKey);
        this.zoneManager = opts.zoneManager;
    }

    async search(query: string | string[], opt: SearchOptions = {}) {
        const zone = ZoneNameSchema.parse(opt.zone || this.zone);

        if (Array.isArray(query)) {
            logger.info(
                `Starting batch search operation for ${query.length} queries`,
            );

            return this.searchBatch(query, zone, opt);
        }

        logger.info(`Starting single query search: ${query}`);
        return this.searchSingle(query, zone, opt);
    }
    private async searchSingle(
        query: string,
        zone: string,
        opt: SearchOptions = {},
    ) {
        const requestData: SERPQueryBody = {
            method: 'GET',
            zone: zone,
            url: toSEUrl(opt.searchEngine, query),
            country: opt.country,
            format: opt.format || 'raw',
        };

        if (opt.dataFormat && opt.dataFormat !== 'html') {
            requestData.data_format = opt.dataFormat;
        }

        dropEmptyKeys(requestData);
        logRequest('POST', REQUEST_API_URL, requestData);

        try {
            const response = await request(REQUEST_API_URL, {
                method: 'POST',
                body: JSON.stringify(requestData),
                headers: this.authHeaders,
                dispatcher: getDispatcher({ timeout: opt.timeout }),
            });

            const responseTxt = await assertResponse(response);
            if (opt.format === 'json') {
                return parseJSON<JSONResponse>(responseTxt);
            }
            return responseTxt;
        } catch (e: any) {
            if (e instanceof BRDError) throw e;
            throw new APIError(`Search failed: ${e.message}`);
        }
    }

    private async searchBatch(
        queries: string[],
        zone: string,
        opt: SearchOptions = {},
    ) {
        const limit = opt.concurrency || DEFAULT_CONCURRENCY;
        logger.info(`Processing ${queries.length} queries in parallel`);
        logger.info(`Concurrency is ${limit}`);

        try {
            const { results } = await PromisePool.for(queries)
                .withConcurrency(limit)
                .useCorrespondingResults()
                .process(async (q) => {
                    try {
                        return await this.searchSingle(q, zone, opt);
                    } catch (e) {
                        return e;
                    }
                });

            const res = results.map((v) => {
                if (v === PromisePool.failed || v === PromisePool.notRun)
                    return new BRDError('Unknown error occurred');
                return v as Exclude<typeof v, symbol>;
            });

            logger.info(`Completed batch operation: ${res.length} results`);

            return res;
        } catch (error: any) {
            logger.error(`Batch operation failed: ${error.message}`);
            throw new APIError(`Batch operation failed:`, error.message);
        }
    }
}
