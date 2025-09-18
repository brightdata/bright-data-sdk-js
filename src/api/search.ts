import { request } from 'undici';
import { REQUEST_API_URL } from '../utils/constants';
import {
    validateZoneName,
    validateCountryCode,
    validateTimeout,
    validateSearchEngine,
    validateQuery,
    validateResponseFormat,
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
import type { SearchOptions, SearchEngine } from '../types';

const logger = getLogger('api.search');

const toSEUrl = (searchEngine: SearchEngine, query: string) => {
    const encoded_query = encodeURIComponent(query.trim());

    switch (searchEngine.toLowerCase()) {
        case 'bing':
            return `https://www.bing.com/search?q=${encoded_query}`;
        case 'yandex':
            return `https://yandex.com/search/?text=${encoded_query}`;
        case 'google':
        default:
            return `https://www.google.com/search?q=${encoded_query}`;
    }
};

export class SearchAPI {
    private api_token: string;

    constructor(api_token: string) {
        this.api_token = api_token;
    }

    async search(query: string | string[], opt: SearchOptions = {}) {
        const {
            searchEngine = 'google',
            responseFormat = 'raw',
            country = '',
            timeout = null,
        } = opt;

        validateQuery(query);
        validateZoneName(opt.zone);
        validateSearchEngine(searchEngine);
        validateResponseFormat(responseFormat);
        validateCountryCode(country);
        validateTimeout(timeout);

        if (Array.isArray(query)) {
            logger.info(
                `Starting batch search operation for ${query.length} queries`,
            );

            return this.searchBatch(query, opt);
        }

        if (typeof query !== 'string' || query.trim() == '')
            throw new ValidationError('Query must be a non-empty string');

        logger.info(`Starting single query search: ${query}`);
        return this.searchSingle(query, opt);
    }

    private async searchSingle(query: string, opt: SearchOptions = {}) {
        const {
            zone,
            searchEngine = 'google',
            responseFormat = 'raw',
            country = '',
            dataFormat = 'markdown',
            timeout = null,
        } = opt;

        const requestData: Record<string, unknown> = {
            url: toSEUrl(searchEngine, query),
            zone,
            format: responseFormat,
            method: 'GET',
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

            if (responseFormat == 'json') return safeJsonParse(response_data);
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

    private async searchBatch(queries: string[], opt: SearchOptions = {}) {
        logger.info(`Processing ${queries.length} queries in parallel`);

        const {
            zone,
            searchEngine = 'google',
            responseFormat = 'json',
            country = '',
            dataFormat = 'markdown',
            timeout = null,
        } = opt;

        const requests = queries.map((query) => {
            const requestBody: Record<string, unknown> = {
                zone: zone,
                url: toSEUrl(searchEngine, query),
                format: responseFormat,
                method: 'GET',
                data_format: dataFormat,
            };

            if (country) {
                requestBody.country = country.toLowerCase();
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            return request(REQUEST_API_URL, {
                method: 'POST',
                headers: getAuthHeaders(this.api_token),
                body: JSON.stringify(requestBody),
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
                    if (responseFormat === 'json') {
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
