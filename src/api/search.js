'use strict'; /*jslint node:true*/

const {
    validateZoneName,
    validateCountryCode,
    validateTimeout,
    validateMaxWorkers,
    validateSearchEngine,
    validateQuery,
    validateResponseFormat,
    validateHttpMethod,
    retryRequest,
    getLogger,
    logRequest,
    safeJsonParse,
    validateResponseSize
} = require('../utils/index.js');

const {ValidationError, APIError, AuthenticationError} = 
    require('../exceptions/errors.js');

const E = module.exports;
const logger = getLogger('api.search');

class SearchAPI {
    constructor(axios_instance, default_timeout = 30*1000, max_retries = 3,
        retry_backoff = 1.5){
        this.axios_instance = axios_instance;
        this.default_timeout = default_timeout;
        this.max_retries = max_retries;
        this.retry_backoff = retry_backoff;
    }
    async search(query, zone, opt = {}){
        const {
            search_engine = 'google',
            response_format = 'raw',
            method = 'GET',
            country = '',
            data_format = 'markdown',
            async_request = false,
            max_workers = 10,
            timeout = null
        } = opt;
        const actual_timeout = timeout || this.default_timeout;
        if (Array.isArray(query)){
            validateQuery(query);
            validateSearchEngine(search_engine);
            validateZoneName(zone);
            validateResponseFormat(response_format);
            validateCountryCode(country);
            validateMaxWorkers(max_workers);
            validateTimeout(actual_timeout);
            logger.info(`Starting batch search operation for ${query.length} `+
                `queries using ${search_engine}`);
            return await this._search_batch(query, zone, opt);
        }
        validateQuery(query);
        validateSearchEngine(search_engine);
        validateZoneName(zone);
        validateResponseFormat(response_format);
        validateHttpMethod(method);
        validateCountryCode(country);
        validateTimeout(actual_timeout);
        logger.info(`Starting single search query: "${query}" using `+
            `${search_engine}`);
        return await this._search_single(query, zone, opt);
    }
    async _search_single(query, zone, opt){
        const {
            search_engine = 'google',
            response_format = 'raw',
            method = 'GET',
            country = '',
            data_format = 'markdown',
            timeout = null
        } = opt;
        const encoded_query = encodeURIComponent(query);
        let search_url;
        switch (search_engine){
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
        const request_data = {
            url: search_url,
            zone,
            format: response_format,
            method: method.toUpperCase(),
            country: country.toLowerCase(),
            data_format
        };
        Object.keys(request_data).forEach(key=>{
            if (request_data[key]=='' || request_data[key]==null ||
                request_data[key]==undefined)
            {
                delete request_data[key];
            }
        });
        const request_config = {
            timeout: timeout || this.default_timeout,
            method: 'POST',
            url: 'https://api.brightdata.com/request',
            data: request_data
        };
        logRequest('POST', 'https://api.brightdata.com/request', request_data);
        try {
            const response = await retryRequest(
                ()=>this.axios_instance.request(request_config),
                this.max_retries,
                this.retry_backoff,
                error=>{
                    const status = error.response?.status;
                    return status && [429, 500, 502, 503, 504].includes(status);
                }
            );
            validateResponseSize(response.data);
            if (response_format=='json')
                return safeJsonParse(response.data);
            return response.data;
        } catch(e){
            if (e.response?.status==401)
                throw new AuthenticationError('Invalid API token or '+
                    'insufficient permissions');
            if (e.response?.status==400)
                throw new ValidationError(`Bad request: `+
                    `${e.response.data?.message || e.message}`);
            throw new APIError(`Search failed: ${e.message}`,
                e.response?.status, e.response?.data);
        }
    }
    async _search_batch(queries, zone, opt){
        const {max_workers = 10} = opt;
        validateMaxWorkers(max_workers);
        logger.info(`Processing ${queries.length} search queries with `+
            `${max_workers} concurrent workers`);
        const results = [];
        const promises = [];
        const semaphore = new Semaphore(max_workers);
        for (let i = 0; i<queries.length; i++){
            const promise = semaphore.acquire().then(async release=>{
                try {
                    const result = await this._search_single(queries[i], zone,
                        opt);
                    results[i] = result;
                    logger.debug(`Completed search ${i+1}/${queries.length}: `+
                        `"${queries[i]}"`);
                } catch(e){
                    logger.error(`Failed to search ${i+1}/${queries.length}: `+
                        `"${queries[i]}" - ${e.message}`);
                    results[i] = {error: e.message, query: queries[i]};
                } finally {
                    release();
                }
            });
            promises.push(promise);
        }
        await Promise.all(promises);
        logger.info(`Completed batch search operation: ${results.length} `+
            'results');
        return results;
    }
}

class Semaphore {
    constructor(count){
        this.count = count;
        this.waiting = [];
    }
    async acquire(){
        return new Promise(resolve=>{
            if (this.count>0){
                this.count--;
                resolve(()=>this.release());
            } else {
                this.waiting.push(()=>{
                    resolve(()=>this.release());
                });
            }
        });
    }
    release(){
        this.count++;
        if (this.waiting.length>0){
            this.count--;
            const next = this.waiting.shift();
            next();
        }
    }
}

E.SearchAPI = SearchAPI;