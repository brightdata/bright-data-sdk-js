'use strict'; /*jslint node:true*/

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const {WebScraper} = require('./api/scrape.js');
const {SearchAPI} = require('./api/search.js');
const {ZoneManager} = require('./utils/zone-manager.js');
const {setupLogging, getLogger} = require('./utils/logging-config.js');
const {
    DEFAULT_MAX_WORKERS,
    DEFAULT_TIMEOUT,
    CONNECTION_POOL_SIZE,
    MAX_RETRIES,
    RETRY_BACKOFF_FACTOR,
    RETRY_STATUSES,
    DEFAULT_WEB_UNLOCKER_ZONE,
    DEFAULT_SERP_ZONE
} = require('./utils/constants.js');
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
            process.env.WEB_UNLOCKER_ZONE || DEFAULT_WEB_UNLOCKER_ZONE;
        this.serp_zone = serp_zone || process.env.SERP_ZONE || DEFAULT_SERP_ZONE;
        this.auto_create_zones = auto_create_zones;
        this.DEFAULT_MAX_WORKERS = DEFAULT_MAX_WORKERS;
        this.DEFAULT_TIMEOUT = DEFAULT_TIMEOUT;
        this.CONNECTION_POOL_SIZE = CONNECTION_POOL_SIZE;
        this.MAX_RETRIES = MAX_RETRIES;
        this.RETRY_BACKOFF_FACTOR = RETRY_BACKOFF_FACTOR;
        this.RETRY_STATUSES = RETRY_STATUSES;
        logger.info('HTTP client configured with secure headers');
        this.web_scraper = new WebScraper(this.api_token,
            this.DEFAULT_TIMEOUT, this.MAX_RETRIES, this.RETRY_BACKOFF_FACTOR);
        this.search_api = new SearchAPI(this.api_token,
            this.DEFAULT_TIMEOUT, this.MAX_RETRIES, this.RETRY_BACKOFF_FACTOR);
        this.zone_manager = new ZoneManager(null, this.api_token);
        
        // Auto-create zones if enabled
        if (this.auto_create_zones) {
            this._ensure_zones();
        }
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
        if (content === null || content === undefined) {
            throw new ValidationError('Content is required for download');
        }
        if (typeof format !== 'string' || format.trim() === '') {
            throw new ValidationError('Format must be a non-empty string');
        }
        const validFormats = ['json', 'csv', 'txt'];
        if (!validFormats.includes(format.toLowerCase())) {
            throw new ValidationError(`Format must be one of: ${validFormats.join(', ')}`);
        }

        logger.info(`Starting content download in ${format} format`);

        const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
        const sizeInBytes = Buffer.byteLength(contentStr, 'utf8');
        const maxSizeBytes = 100 * 1024 * 1024;
        if (sizeInBytes > maxSizeBytes) {
            throw new ValidationError(`Content size (${Math.round(sizeInBytes / 1024 / 1024)}MB) exceeds maximum allowed size (100MB)`);
        }

        if (!filename){
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            filename = `brightdata_content_${timestamp}.${format}`;
        } else {
            filename = filename.replace(/[<>:"/\\|?*]/g, '_').replace(/\.\./g, '_');
            const ext = path.extname(filename);
            if (!ext) {
                filename += `.${format}`;
            }
        }
        let data_to_write;
        switch (format.toLowerCase()){
        case 'json':
            data_to_write = JSON.stringify(content, null, 2);
            break;
        case 'csv':
            if (Array.isArray(content) && content.length > 0 &&
                typeof content[0] === 'object' && content[0] !== null) {
                try {
                    const headers = Object.keys(content[0]).join(',');
                    const rows = content.map(obj => {
                        if (typeof obj !== 'object' || obj === null) {
                            throw new ValidationError('All items in array must be objects for CSV format');
                        }
                        return Object.values(obj).map(val => {
                            if (val === null || val === undefined) {
                                return '';
                            }
                            const strVal = String(val);
                            if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
                                return `"${strVal.replace(/"/g, '""')}"`;
                            }
                            return strVal;
                        }).join(',');
                    });
                    data_to_write = [headers, ...rows].join('\n');
                } catch (csvError) {
                    logger.warning(`CSV conversion failed: ${csvError.message}, falling back to JSON`);
                    data_to_write = JSON.stringify(content, null, 2);
                }
            } else {
                logger.warning('Content not suitable for CSV format, using JSON instead');
                data_to_write = JSON.stringify(content, null, 2);
            }
            break;
        case 'txt':
            if (typeof content=='string') {
                data_to_write = content;
            } else if (Array.isArray(content) && content.every(item => typeof item === 'string')) {
                data_to_write = content.map((item, index) =>
                    `--- RESULT ${index + 1} ---\n\n${item}`
                ).join('\n\n');
            } else {
                data_to_write = JSON.stringify(content, null, 2);
            }
            break;
        default:
            data_to_write = JSON.stringify(content, null, 2);
        }

        try {
            const dir = path.dirname(filename);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(filename, data_to_write, 'utf8');

            if (!fs.existsSync(filename)) {
                throw new Error('File was not created successfully');
            }

            const stats = fs.statSync(filename);
            logger.info(`Content successfully saved to: ${filename} (${stats.size} bytes)`);
            return path.resolve(filename);

        } catch (writeError) {
            logger.error(`Failed to write file: ${writeError.message}`);
            if (writeError.code === 'EACCES') {
                throw new Error(`Permission denied: Cannot write to ${filename}`);
            } else if (writeError.code === 'ENOSPC') {
                throw new Error('Insufficient disk space to write file');
            } else if (writeError.code === 'EMFILE' || writeError.code === 'ENFILE') {
                throw new Error('Too many open files, cannot write file');
            } else {
                throw new Error(`Failed to write file ${filename}: ${writeError.message}`);
            }
        }
    }
    _ensure_zones(){
        try {
            logger.info('Ensuring required zones exist for synchronous client');
            const results = this.zone_manager.ensureRequiredZones(
                this.web_unlocker_zone, this.serp_zone);
            
            if (results.web_unlocker.created || results.serp.created) {
                logger.info('Zone auto-creation completed successfully', results);
            }
        } catch (e) {
            logger.warning(`Zone auto-creation failed: ${e.message}. Continuing with existing zones.`);
        }
    }
    
    list_zones(){
        try {
            return this.zone_manager.list_zones();
        } catch (e) {
            logger.error(`Failed to list zones: ${e.message}`);
            return [];
        }
    }
}

E.bdclient = bdclient;