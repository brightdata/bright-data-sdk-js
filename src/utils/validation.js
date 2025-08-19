'use strict'; /*jslint node:true*/

const {URL} = require('url');
const {ValidationError} = require('../exceptions/errors.js');

const E = module.exports;

function validate_url(url){
    if (typeof url!='string')
        throw new ValidationError(`URL must be a string, got ${typeof url}`);
    if (!url.trim())
        throw new ValidationError('URL cannot be empty or whitespace');
    if (url.length>8192)
        throw new ValidationError('URL exceeds maximum length of 8192 '+
            'characters');
    try {
        const parsed = new URL(url.trim());
        if (!parsed.protocol)
            throw new ValidationError(`URL must include a scheme (http/https)`+
                `: ${url}`);
        if (!['http:', 'https:'].includes(parsed.protocol.toLowerCase()))
            throw new ValidationError(`URL scheme must be http or https, got: `+
                `${parsed.protocol}`);
        if (!parsed.hostname)
            throw new ValidationError(`URL must include a valid domain: `+
                `${url}`);
        if (/[<>"']/.test(url))
            throw new ValidationError('URL contains invalid characters');
    } catch(e){
        if (e instanceof ValidationError)
            throw e;
        throw new ValidationError(`Invalid URL format '${url}': ${e.message}`);
    }
}

function validate_zone_name(zone = null){
    if (zone==null || zone==undefined)
        return;
    if (typeof zone!='string')
        throw new ValidationError(`Zone name must be a string, got `+
            `${typeof zone}`);
    const trimmed_zone = zone.trim();
    if (!trimmed_zone)
        throw new ValidationError('Zone name cannot be empty or whitespace');
    if (trimmed_zone.length<3)
        throw new ValidationError('Zone name must be at least 3 characters '+
            'long');
    if (trimmed_zone.length>63)
        throw new ValidationError('Zone name must not exceed 63 characters');
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed_zone))
        throw new ValidationError('Zone name can only contain letters, '+
            'numbers, hyphens, and underscores');
    if (trimmed_zone.startsWith('-') || trimmed_zone.endsWith('-'))
        throw new ValidationError('Zone name cannot start or end with a '+
            'hyphen');
    if (trimmed_zone.startsWith('_') || trimmed_zone.endsWith('_'))
        throw new ValidationError('Zone name cannot start or end with an '+
            'underscore');
}

function validate_country_code(country){
    if (typeof country!='string')
        throw new ValidationError(`Country code must be a string, got `+
            `${typeof country}`);
    const trimmed_country = country.trim().toLowerCase();
    if (trimmed_country.length==0)
        return;
    if (trimmed_country.length!=2)
        throw new ValidationError('Country code must be exactly 2 characters '+
            '(ISO 3166-1 alpha-2) or empty');
    if (!/^[a-z]+$/.test(trimmed_country))
        throw new ValidationError('Country code must contain only letters');
}

function validate_timeout(timeout){
    if (timeout==null || timeout==undefined)
        return;
    if (!Number.isInteger(timeout))
        throw new ValidationError(`Timeout must be an integer, got `+
            `${typeof timeout}`);
    if (timeout<=0)
        throw new ValidationError('Timeout must be greater than 0 '+
            'milliseconds');
    if (timeout>300*1000)
        throw new ValidationError('Timeout cannot exceed 300000 milliseconds '+
            '(5 minutes)');
}

function validate_max_workers(max_workers){
    if (max_workers==null || max_workers==undefined)
        return;
    if (!Number.isInteger(max_workers))
        throw new ValidationError(`max_workers must be an integer, got `+
            `${typeof max_workers}`);
    if (max_workers<=0)
        throw new ValidationError('max_workers must be greater than 0');
    if (max_workers>50)
        throw new ValidationError('max_workers cannot exceed 50 (to prevent '+
            'resource exhaustion)');
}

function validate_url_list(urls, max_urls = 100){
    if (!Array.isArray(urls))
        throw new ValidationError(`URL list must be an array, got `+
            `${typeof urls}`);
    if (urls.length==0)
        throw new ValidationError('URL list cannot be empty');
    if (urls.length>max_urls)
        throw new ValidationError(`URL list cannot contain more than `+
            `${max_urls} URLs`);
    urls.forEach((url, i)=>{
        try {
            validate_url(url);
        } catch(e){
            throw new ValidationError(`Invalid URL at index ${i}: `+
                `${e.message}`);
        }
    });
}

function validate_search_engine(search_engine){
    if (typeof search_engine!='string')
        throw new ValidationError(`Search engine must be a string, got `+
            `${typeof search_engine}`);
    const valid_engines = ['google', 'bing', 'yandex'];
    const normalized_engine = search_engine.trim().toLowerCase();
    if (!valid_engines.includes(normalized_engine))
        throw new ValidationError(`Invalid search engine '${search_engine}'. `+
            `Valid options: ${valid_engines.join(', ')}`);
}

function validate_query(query){
    if (typeof query=='string'){
        if (!query.trim())
            throw new ValidationError('Search query cannot be empty or '+
                'whitespace');
        if (query.length>2048)
            throw new ValidationError('Search query cannot exceed 2048 '+
                'characters');
    } else if (Array.isArray(query)){
        if (query.length==0)
            throw new ValidationError('Query list cannot be empty');
        if (query.length>50)
            throw new ValidationError('Query list cannot contain more than '+
                '50 queries');
        query.forEach((q, i)=>{
            if (typeof q!='string')
                throw new ValidationError(`Query at index ${i} must be a `+
                    `string, got ${typeof q}`);
            if (!q.trim())
                throw new ValidationError(`Query at index ${i} cannot be `+
                    'empty or whitespace');
            if (q.length>2048)
                throw new ValidationError(`Query at index ${i} cannot exceed `+
                    '2048 characters');
        });
    } else
        throw new ValidationError(`Query must be a string or array of `+
            `strings, got ${typeof query}`);
}

function validate_response_format(response_format){
    if (typeof response_format!='string')
        throw new ValidationError(`Response format must be a string, got `+
            `${typeof response_format}`);
    const valid_formats = ['json', 'raw'];
    const normalized_format = response_format.trim().toLowerCase();
    if (!valid_formats.includes(normalized_format))
        throw new ValidationError(`Invalid response format `+
            `'${response_format}'. Valid options: ${valid_formats.join(', ')}`);
}

function validate_http_method(method){
    if (typeof method!='string')
        throw new ValidationError(`HTTP method must be a string, got `+
            `${typeof method}`);
    const valid_methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    const normalized_method = method.trim().toUpperCase();
    if (!valid_methods.includes(normalized_method))
        throw new ValidationError(`Invalid HTTP method '${method}'. Valid `+
            `options: ${valid_methods.join(', ')}`);
}

E.validateUrl = validate_url;
E.validateZoneName = validate_zone_name;
E.validateCountryCode = validate_country_code;
E.validateTimeout = validate_timeout;
E.validateMaxWorkers = validate_max_workers;
E.validateUrlList = validate_url_list;
E.validateSearchEngine = validate_search_engine;
E.validateQuery = validate_query;
E.validateResponseFormat = validate_response_format;
E.validateHttpMethod = validate_http_method;