import { REQUEST_API_URL } from '../utils/constants';
import { safeJsonParse } from '../utils/misc';
import { getLogger, logRequest } from '../utils/logging-config';
import {
    ValidationError,
    APIError,
    AuthenticationError,
} from '../exceptions/errors';
import { request, getDispatcher, isResponseOk } from '../utils/net';
import { dropEmptyKeys } from '../utils/misc';
import { getAuthHeaders } from '../utils/auth';
import { ZoneNameSchema } from '../schemas';
import type { SearchOptions, SearchEngine } from '../types';
import type { ZoneManager } from '../utils/zone-manager';

const logger = getLogger('api.search');

interface SERPQueryBody {
    method: 'GET';
    url: string;
    zone: SearchOptions['zone'];
    format: SearchOptions['responseFormat'];
    country?: SearchOptions['country'];
    data_format?: SearchOptions['dataFormat'];
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

        if (typeof query !== 'string' || query.trim() == '')
            throw new ValidationError('Query must be a non-empty string');

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
            format: opt.responseFormat || 'raw',
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

            const response_data = await response.body.text();

            if (response.statusCode >= 400) {
                if (response.statusCode == 401)
                    throw new AuthenticationError(
                        'Invalid API key or insufficient permissions',
                    );
                if (response.statusCode == 400)
                    throw new ValidationError(`Bad request: ${response_data}`);
                throw new APIError(
                    `Search failed: HTTP ${response.statusCode}`,
                    response.statusCode,
                    response_data,
                );
            }

            if (opt.responseFormat == 'json')
                return safeJsonParse(response_data);
            return response_data;
        } catch (e: any) {
            if (
                e instanceof AuthenticationError ||
                e instanceof ValidationError ||
                e instanceof APIError
            ) {
                throw e;
            }
            throw new APIError(`Search failed: ${e.message}`);
        }
    }

    private async searchBatch(
        queries: string[],
        zone: string,
        opt: SearchOptions = {},
    ) {
        logger.info(`Processing ${queries.length} queries in parallel`);

        const requests = queries.map((query) => {
            const requestData: SERPQueryBody = {
                method: 'GET',
                zone,
                url: toSEUrl(opt.searchEngine, query),
                country: opt.country,
                format: opt.responseFormat || 'raw',
                data_format: opt.dataFormat || 'markdown',
            };

            dropEmptyKeys(requestData);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), opt.timeout);

            return request(REQUEST_API_URL, {
                method: 'POST',
                headers: this.authHeaders,
                body: JSON.stringify(requestData),
                signal: controller.signal,
                dispatcher: getDispatcher(),
            })
                .then((response) => {
                    clearTimeout(timeoutId);
                    return response;
                })
                .catch((error) => {
                    clearTimeout(timeoutId);
                    throw error;
                });
        });

        try {
            const responses = await Promise.all(requests);

            const results = [];
            for (let i = 0; i < responses.length; i++) {
                const response = responses[i];
                const query = queries[i];

                try {
                    if (!isResponseOk(response)) {
                        results.push({
                            error: `HTTP ${response.statusCode}`,
                            query: query,
                        });
                        continue;
                    }

                    let data;
                    if (opt.responseFormat === 'json') {
                        data = await response.body.json();
                    } else {
                        data = await response.body.text();
                    }

                    results.push(data);
                    logger.debug(`Completed search query: ${query}`);
                } catch (error) {
                    logger.error(
                        `Failed to process query: ${query} - ${error.message}`,
                    );
                    results.push({ error: error.message, query: query });
                }
            }

            logger.info(
                `Completed batch search operation: ${results.length} results`,
            );
            return results;
        } catch (error: any) {
            logger.error(`Batch search failed: ${error.message}`);
            return queries.map((query) => ({
                error: error.message,
                query: query,
            }));
        }
    }
}
