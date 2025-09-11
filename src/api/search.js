'use strict'; /*jslint node:true*/

const request = require('sync-request');
const {USER_AGENT,REQUEST_API_URL} = require('../utils/constants.js');
const {
    validateZoneName,
    validateCountryCode,
    validateTimeout,
    validateSearchEngine,
    validateQuery,
    validateResponseFormat,
    getLogger,
    logRequest,
    safeJsonParse,
    validateResponseSize
} = require('../utils/index.js');

const {ValidationError,APIError,AuthenticationError} = 
    require('../exceptions/errors.js');

const E = module.exports;
const logger = getLogger('api.search');

class SearchAPI {
    constructor(api_token,default_timeout = 30*1000,max_retries = 3,
        retry_backoff = 1.5){
        this.api_token = api_token;
        this.default_timeout = default_timeout;
        this.max_retries = max_retries;
        this.retry_backoff = retry_backoff;
    }
    
    search(query,zone,opt = {}){
        const {
            search_engine = 'google',
            response_format = 'raw',
            country = '',
            timeout = null
        } = opt;
        
        if (Array.isArray(query)){
            validateQuery(query);
            validateSearchEngine(search_engine);
            validateZoneName(zone);
            validateResponseFormat(response_format);
            validateCountryCode(country);
            validateTimeout(timeout || this.default_timeout);
            
            logger.info(`Starting batch search operation for ${query.length} queries`);
            return this._search_batch(query,zone,opt);
        }
        
        if (typeof query !== 'string' || query.trim() === '') {
            throw new ValidationError('Query must be a non-empty string');
        }
        validateZoneName(zone);
        validateSearchEngine(search_engine);
        validateResponseFormat(response_format);
        validateCountryCode(country);
        validateTimeout(timeout || this.default_timeout);
        
        logger.info(`Starting single query search: ${query}`);
        return this._search_single(query,zone,opt);
    }
    
    _search_single(query,zone,opt){
        const {
            search_engine = 'google',
            response_format = 'raw',
            country = '',
            data_format = 'markdown',
            timeout = null
        } = opt;
        
        const encoded_query = encodeURIComponent(query.trim());
        let search_url;
        switch (search_engine.toLowerCase()){
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
            url:search_url,
            zone,
            format:response_format,
            method:'GET',
            country:country.toLowerCase(),
            data_format
        };
        
        // Clean up empty values
        Object.keys(request_data).forEach(key => {
            if (request_data[key] === '' || request_data[key] === null || 
                request_data[key] === undefined) {
                delete request_data[key];
            }
        });
        
        logRequest('POST',REQUEST_API_URL,request_data);
        
        try {
            const response = request('POST',REQUEST_API_URL,{
                json:request_data,
                timeout:timeout || this.default_timeout,
                headers:{
                    'Authorization':`Bearer ${this.api_token}`,
                    'Content-Type':'application/json',
                    'User-Agent':USER_AGENT
                }
            });
            
            const response_data = response.getBody('utf8');
            validateResponseSize(response_data);
            
            if (response.statusCode >= 400) {
                if (response.statusCode === 401) {
                    throw new AuthenticationError('Invalid API token or insufficient permissions');
                }
                if (response.statusCode === 400) {
                    throw new ValidationError(`Bad request: ${response_data}`);
                }
                throw new APIError(`Search failed: HTTP ${response.statusCode}`, 
                    response.statusCode,response_data);
            }
            
            if (response_format === 'json') {
                return safeJsonParse(response_data);
            }
            return response_data;
            
        } catch(e) {
            if (e instanceof AuthenticationError || e instanceof ValidationError || 
                e instanceof APIError) {
                throw e;
            }
            throw new APIError(`Search failed: ${e.message}`);
        }
    }
    
    async _search_batch_async(queries,zone,opt) {
        logger.info(`Processing ${queries.length} queries in parallel`);
        
        // Create all fetch requests (same pattern as successful scraper)
        const requests = queries.map((query) => {
            const {
                search_engine = 'google',
                response_format = 'json',
                country = '',
                data_format = 'markdown'
            } = opt;
            
            const encoded_query = encodeURIComponent(query.trim());
            let search_url;
            switch (search_engine.toLowerCase()){
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
                zone:zone,
                url:search_url,
                format:response_format,
                method:'GET',
                data_format:data_format
            };
            
            if (country) {
                requestBody.country = country.toLowerCase();
            }
            
            return fetch('https://api.brightdata.com/request',{
                method:'POST',
                headers:{
                    'Authorization':`Bearer ${this.api_token}`,
                    'Content-Type':'application/json'
                },
                body:JSON.stringify(requestBody)
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
                        results.push({error:`HTTP ${response.status}`,query:query});
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
                    logger.error(`Failed to process query: ${query} - ${error.message}`);
                    results.push({error:error.message,query:query});
                }
            }
            
            logger.info(`Completed batch search operation: ${results.length} results`);
            return results;
            
        } catch (error) {
            logger.error(`Batch search failed: ${error.message}`);
            return queries.map(query => ({error:error.message,query:query}));
        }
    }
    
    _search_batch(queries,zone,opt) {
        // Automatically use async parallel processing for multiple queries
        // User calls it as sync, but internally we use async for performance
        const deasync = require('deasync');
        
        let isDone = false;
        let result = null;
        let error = null;
        
        // Call the async parallel version "in the background"
        this._search_batch_async(queries,zone,opt)
            .then(res => {
                result = res;
                isDone = true;
            })
            .catch(err => {
                error = err;
                isDone = true;
            });
        
        // Wait synchronously for the async operation to complete
        deasync.loopWhile(() => !isDone);
        
        if (error) {
            throw error;
        }
        
        return result;
    }
}

E.SearchAPI = SearchAPI;