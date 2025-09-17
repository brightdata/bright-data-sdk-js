import { request } from 'undici';
import { REQUEST_API_URL } from '../utils/constants';
import {
    validateZoneName,
    validateCountryCode,
    validateTimeout,
    validateSearchEngine,
    validateQuery,
    validateResponseFormat,
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
import type { SearchOptions } from '../types';

const logger = getLogger('api.search');

export class SearchAPI {
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

    async search(query: string | string[], opt: SearchOptions = {}) {
        const {
            zone,
            search_engine = 'google',
            response_format = 'raw',
            country = '',
            timeout = null,
        } = opt;

        if (Array.isArray(query)) {
            validateQuery(query);
            validateSearchEngine(search_engine);
            validateZoneName(zone);
            validateResponseFormat(response_format);
            validateCountryCode(country);
            validateTimeout(timeout || this.default_timeout);
            logger.info(
                `Starting batch search operation for ${query.length} queries`,
            );
            return this._search_batch(query, opt);
        }

        if (typeof query !== 'string' || query.trim() == '')
            throw new ValidationError('Query must be a non-empty string');
        validateZoneName(zone);
        validateSearchEngine(search_engine);
        validateResponseFormat(response_format);
        validateCountryCode(country);
        validateTimeout(timeout || this.default_timeout);

        logger.info(`Starting single query search: ${query}`);
        return this._search_single(query, opt);
    }

    async _search_single(query: string, opt: SearchOptions = {}) {
        const {
            zone,
            search_engine = 'google',
            response_format = 'raw',
            country = '',
            data_format = 'markdown',
            timeout = null,
        } = opt;

        const encoded_query = encodeURIComponent(query.trim());
        let search_url;
        switch (search_engine.toLowerCase()) {
            case 'bing':
                search_url = `https://www.bing.com/search?q=${encoded_query}`;
                break;
            case 'yandex':
                search_url = `https://yandex.com/search/?text=${encoded_query}`;
                break;
            case 'google':
            default:
                search_url = `https://www.google.com/search?q=${encoded_query}`;
        }

        const request_data: Record<string, unknown> = {
            url: search_url,
            zone,
            format: response_format,
            method: 'GET',
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
                if (response.statusCode == 401)
                    throw new AuthenticationError(
                        'Invalid API token or insufficient permissions',
                    );
                if (response.statusCode == 400)
                    throw new ValidationError(`Bad request: ${response_data}`);
                throw new APIError(
                    `Search failed: HTTP ${response.statusCode}`,
                    response.statusCode,
                    response_data,
                );
            }

            if (response_format == 'json') return safeJsonParse(response_data);
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

    async _search_batch(queries: string[], opt: SearchOptions = {}) {
        logger.info(`Processing ${queries.length} queries in parallel`);

        const {
            zone,
            search_engine = 'google',
            response_format = 'json',
            country = '',
            data_format = 'markdown',
            timeout = null,
        } = opt;

        // Create all fetch requests (same pattern as successful scraper)
        const requests = queries.map((query) => {
            const encoded_query = encodeURIComponent(query.trim());
            let search_url;
            switch (search_engine.toLowerCase()) {
                case 'bing':
                    search_url = `https://www.bing.com/search?q=${encoded_query}`;
                    break;
                case 'yandex':
                    search_url = `https://yandex.com/search/?text=${encoded_query}`;
                    break;
                case 'google':
                default:
                    search_url = `https://www.google.com/search?q=${encoded_query}`;
            }

            const requestBody = {
                zone: zone,
                url: search_url,
                format: response_format,
                method: 'GET',
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

            return fetch(REQUEST_API_URL, {
                method: 'POST',
                headers: getAuthHeaders(this.api_token),
                body: JSON.stringify(requestBody),
                signal: controller.signal,
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
            // Wait for all requests in parallel
            const responses = await Promise.all(requests);

            // Process all responses
            const results = [];
            for (let i = 0; i < responses.length; i++) {
                const response = responses[i];
                const query = queries[i];

                try {
                    if (!response.ok) {
                        results.push({
                            error: `HTTP ${response.status}`,
                            query: query,
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
