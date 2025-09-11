'use strict'; /*jslint node:true*/

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const {WebScraper} = require('./api/scrape.js');
const {SearchAPI} = require('./api/search.js');
const {setupLogging, getLogger} = require('./utils/logging-config.js');
const {ValidationError, AuthenticationError, APIError} = 
    require('./exceptions/errors.js');

const E = module.exports;
const logger = getLogger('client');

class bdclient {
    constructor(opt = {}){
        const {
            api_token,
            auto_create_zones = true,
            web_unlocker_zone,
            serp_zone,
            log_level = 'INFO',
            structured_logging = true,
            verbose = null
        } = opt;
        const env_verbose = process.env.BRIGHTDATA_VERBOSE?.toLowerCase();
        const is_verbose = verbose !== null ? verbose : 
            ['true', '1', 'yes', 'on'].includes(env_verbose);
        setupLogging(log_level, structured_logging, is_verbose);
        logger.info('Initializing Bright Data SDK client');
        this.api_token = api_token || process.env.BRIGHTDATA_API_TOKEN;
        if (!this.api_token){
            logger.error('API token not provided');
            throw new ValidationError('API token is required. Provide it as '+
                'parameter or set BRIGHTDATA_API_TOKEN environment variable');
        }
        if (typeof this.api_token!='string'){
            logger.error('API token must be a string');
            throw new ValidationError('API token must be a string');
        }
        if (this.api_token.trim().length<10){
            logger.error('API token appears to be invalid (too short)');
            throw new ValidationError('API token appears to be invalid');
        }
        const token_preview = this.api_token.length>8 ?
            `${this.api_token.slice(0, 4)}***${this.api_token.slice(-4)}` :
            '***';
        logger.info(`API token validated successfully: ${token_preview}`);
        this.web_unlocker_zone = web_unlocker_zone ||
            process.env.WEB_UNLOCKER_ZONE || 'sdk_unlocker';
        this.serp_zone = serp_zone || process.env.SERP_ZONE || 'sdk_serp';
        this.auto_create_zones = auto_create_zones;
        this.DEFAULT_MAX_WORKERS = 10;
        this.DEFAULT_TIMEOUT = 30*1000;
        this.CONNECTION_POOL_SIZE = 20;
        this.MAX_RETRIES = 3;
        this.RETRY_BACKOFF_FACTOR = 1.5;
        this.RETRY_STATUSES = new Set([429, 500, 502, 503, 504]);
        logger.info('HTTP client configured with secure headers');
        this.web_scraper = new WebScraper(this.api_token,
            this.DEFAULT_TIMEOUT, this.MAX_RETRIES, this.RETRY_BACKOFF_FACTOR);
        this.search_api = new SearchAPI(this.api_token,
            this.DEFAULT_TIMEOUT, this.MAX_RETRIES, this.RETRY_BACKOFF_FACTOR);
        // Zone auto-creation disabled for synchronous version
    }
    scrape(url, opt = {}){
        const {
            zone = null,
            response_format = 'raw',
            method = 'GET',
            country = '',
            data_format = 'markdown',
            timeout = null
        } = opt;
        logger.info('Starting scrape operation for '+
            `${Array.isArray(url) ? url.length : 1} URL(s)`);
        const actual_zone = zone || this.web_unlocker_zone;
        const actual_timeout = timeout || this.DEFAULT_TIMEOUT;
        return this.web_scraper.scrape(url, actual_zone, {
            response_format,
            method,
            country,
            data_format,
            timeout: actual_timeout
        });
    }
    search(query, opt = {}){
        const {
            zone = null,
            search_engine = 'google',
            response_format = 'raw',
            country = '',
            timeout = null
        } = opt;
        logger.info('Starting search operation for '+
            `${Array.isArray(query) ? query.length : 1} query/queries`);
        const actual_zone = zone || this.serp_zone;
        const actual_timeout = timeout || this.DEFAULT_TIMEOUT;
        return this.search_api.search(query, actual_zone, {
            search_engine,
            response_format,
            country,
            timeout: actual_timeout
        });
    }
    download_content(content, filename = null, format = 'json'){
        logger.info(`Starting content download in ${format} format`);
        if (!filename){
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            filename = `brightdata_content_${timestamp}.${format}`;
        }
        let data_to_write;
        switch (format.toLowerCase()){
        case 'json':
            data_to_write = JSON.stringify(content, null, 2);
            break;
        case 'csv':
            if (Array.isArray(content) && content.length>0 &&
                typeof content[0]=='object'){
                const headers = Object.keys(content[0]).join(',');
                const rows = content.map(obj=>Object.values(obj).map(val=>
                    typeof val=='string' ? `"${val.replace(/"/g, '""')}"` : val
                ).join(','));
                data_to_write = [headers, ...rows].join('\n');
            } else
                data_to_write = JSON.stringify(content, null, 2);
            break;
        case 'txt':
            data_to_write = typeof content=='string' ? content :
                JSON.stringify(content, null, 2);
            break;
        default:
            data_to_write = JSON.stringify(content, null, 2);
        }
        fs.writeFileSync(filename, data_to_write, 'utf8');
        logger.info(`Content successfully saved to: ${filename}`);
        return path.resolve(filename);
    }
    list_zones(){
        logger.info('Zone listing not available in synchronous version');
        return [];
    }
}

E.bdclient = bdclient;