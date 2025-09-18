import fs from 'fs';
import path from 'path';
import './config';
import { WebScraper } from './api/scrape';
import { SearchAPI } from './api/search';
import { ZoneManager } from './utils/zone-manager';
import { setupLogging, getLogger } from './utils/logging-config';
import {
    DEFAULT_TIMEOUT,
    DEFAULT_WEB_UNLOCKER_ZONE,
    DEFAULT_SERP_ZONE,
} from './utils/constants';
import { ValidationError } from './exceptions/errors';
import type { ZoneInfo, ScrapeOptions, SearchOptions } from './types';

const logger = getLogger('client');

interface BdClientOptions {
    /**
     * Your Bright Data API token (can also be set via BRIGHTDATA_API_TOKEN env var)
     * @example 'brd-customer-hl_12345678-zone-web_unlocker:abc123xyz'
     */
    apiToken?: string;
    /**
     * Automatically create required zones if they don't exist (default: true)
     * @example true | false
     */
    autoCreateZones?: boolean;
    /**
     * Custom zone name for web unlocker (default: from env or 'sdk_unlocker')
     * @example 'my_web_zone' | 'web_unlocker_1' | 'scraping_zone'
     */
    webUnlockerZone?: string;
    /**
     * Custom zone name for SERP API (default: from env or 'sdk_serp')
     * @example 'my_serp_zone' | 'search_zone' | 'serp_api_1'
     */
    serpZone?: string;
    /**
     * Log level (default: 'INFO')
     * Available values: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
     */
    logLevel?: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
    /**
     * Use structured JSON logging (default: true)
     * @example true (JSON format) | false (plain text)
     */
    structuredLogging?: boolean;
    /**
     * Enable verbose logging (default: false)
     * @example true | false
     */
    verbose?: boolean;
}

export class bdclient {
    private apiToken!: string;
    private webUnlockerZone: string;
    private serpZone: string;
    private autoCreateZones: boolean;
    private webScraper: WebScraper;
    private searchApi: SearchAPI;
    private zoneManager: ZoneManager;

    constructor(opt: BdClientOptions = {}) {
        const {
            apiToken,
            autoCreateZones = true,
            webUnlockerZone,
            serpZone,
            logLevel = 'INFO',
            structuredLogging = true,
            verbose = null,
        } = opt;
        const env_verbose = process.env.BRIGHTDATA_VERBOSE?.toLowerCase();
        const is_verbose = verbose
            ? verbose
            : ['true', '1', 'yes', 'on'].includes(env_verbose || '');
        setupLogging(logLevel, structuredLogging, is_verbose);
        logger.info('Initializing Bright Data SDK client');

        const token = apiToken || process.env.BRIGHTDATA_API_TOKEN;

        if (!token) {
            logger.error('API token not provided');

            throw new ValidationError(
                'API token is required. Provide it as ' +
                    'parameter or set BRIGHTDATA_API_TOKEN environment variable',
            );
        }
        if (typeof token != 'string') {
            logger.error('API token must be a string');
            throw new ValidationError('API token must be a string');
        }
        if (token.trim().length < 10) {
            logger.error('API token appears to be invalid (too short)');
            throw new ValidationError('API token appears to be invalid');
        }
        this.apiToken = token;
        const token_preview =
            this.apiToken.length > 8
                ? `${this.apiToken.slice(0, 4)}***${this.apiToken.slice(-4)}`
                : '***';
        logger.info(`API token validated successfully: ${token_preview}`);
        this.webUnlockerZone =
            webUnlockerZone ||
            process.env.WEB_UNLOCKER_ZONE ||
            DEFAULT_WEB_UNLOCKER_ZONE;
        this.serpZone = serpZone || process.env.SERP_ZONE || DEFAULT_SERP_ZONE;
        this.autoCreateZones = autoCreateZones;
        logger.info('HTTP client configured with secure headers');
        this.webScraper = new WebScraper(this.apiToken);
        this.searchApi = new SearchAPI(this.apiToken);
        this.zoneManager = new ZoneManager(this.apiToken);
    }
    async init() {
        if (this.autoCreateZones) {
            await this._ensure_zones();
        }
    }
    scrape(url: string | string[], opt: ScrapeOptions = {}) {
        const {
            zone,
            responseFormat = 'raw',
            method = 'GET',
            country = '',
            dataFormat = 'markdown',
            timeout,
        } = opt;
        logger.info(
            'Starting scrape operation for ' +
                `${Array.isArray(url) ? url.length : 1} URL(s)`,
        );

        return this.webScraper.scrape(url, {
            responseFormat,
            method,
            country,
            dataFormat,
            zone: zone || this.webUnlockerZone,
            timeout,
        });
    }
    search(query: string | string[], opt: SearchOptions = {}) {
        const {
            zone,
            searchEngine = 'google',
            responseFormat = 'raw',
            country = '',
            timeout,
        } = opt;

        logger.info(
            'Starting search operation for ' +
                `${Array.isArray(query) ? query.length : 1} query/queries`,
        );

        return this.searchApi.search(query, {
            zone: zone || this.serpZone,
            searchEngine,
            responseFormat,
            country,
            timeout,
        });
    }
    download_content(
        content: any,
        filename: string | null = null,
        format: 'json' | 'csv' | 'txt' = 'json',
    ) {
        if (content === null || content === undefined) {
            throw new ValidationError('Content is required for download');
        }
        if (typeof format !== 'string' || format.trim() === '') {
            throw new ValidationError('Format must be a non-empty string');
        }
        const validFormats = ['json', 'csv', 'txt'];
        if (!validFormats.includes(format.toLowerCase())) {
            throw new ValidationError(
                `Format must be one of: ${validFormats.join(', ')}`,
            );
        }

        logger.info(`Starting content download in ${format} format`);

        const contentStr =
            typeof content === 'string' ? content : JSON.stringify(content);
        const sizeInBytes = Buffer.byteLength(contentStr, 'utf8');
        const maxSizeBytes = 100 * 1024 * 1024;
        if (sizeInBytes > maxSizeBytes) {
            throw new ValidationError(
                `Content size (${Math.round(
                    sizeInBytes / 1024 / 1024,
                )}MB) exceeds maximum allowed size (100MB)`,
            );
        }

        if (!filename) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            filename = `brightdata_content_${timestamp}.${format}`;
        } else {
            filename = filename
                .replace(/[<>:"/\\|?*]/g, '_')
                .replace(/\.\./g, '_');
            const ext = path.extname(filename);
            if (!ext) {
                filename += `.${format}`;
            }
        }
        let data_to_write;
        switch (format.toLowerCase()) {
            case 'json':
                data_to_write = JSON.stringify(content, null, 2);
                break;
            case 'csv':
                if (
                    Array.isArray(content) &&
                    content.length > 0 &&
                    typeof content[0] === 'object' &&
                    content[0] !== null
                ) {
                    try {
                        const headers = Object.keys(content[0]).join(',');
                        const rows = content.map((obj) => {
                            if (typeof obj !== 'object' || obj === null) {
                                throw new ValidationError(
                                    'All items in array must be objects for CSV format',
                                );
                            }
                            return Object.values(obj)
                                .map((val) => {
                                    if (val === null || val === undefined) {
                                        return '';
                                    }
                                    const strVal = String(val);
                                    if (
                                        strVal.includes(',') ||
                                        strVal.includes('"') ||
                                        strVal.includes('\n')
                                    ) {
                                        return `"${strVal.replace(/"/g, '""')}"`;
                                    }
                                    return strVal;
                                })
                                .join(',');
                        });
                        data_to_write = [headers, ...rows].join('\n');
                    } catch (csvError: any) {
                        logger.warning(
                            `CSV conversion failed: ${csvError.message}, falling back to JSON`,
                        );
                        data_to_write = JSON.stringify(content, null, 2);
                    }
                } else {
                    logger.warning(
                        'Content not suitable for CSV format, using JSON instead',
                    );
                    data_to_write = JSON.stringify(content, null, 2);
                }
                break;
            case 'txt':
                if (typeof content == 'string') {
                    data_to_write = content;
                } else if (
                    Array.isArray(content) &&
                    content.every((item) => typeof item === 'string')
                ) {
                    data_to_write = content
                        .map(
                            (item, index) =>
                                `--- RESULT ${index + 1} ---\n\n${item}`,
                        )
                        .join('\n\n');
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
            logger.info(
                `Content successfully saved to: ${filename} (${stats.size} bytes)`,
            );
            return path.resolve(filename);
        } catch (writeError: any) {
            logger.error(`Failed to write file: ${writeError.message}`);
            if (writeError.code === 'EACCES') {
                throw new Error(
                    `Permission denied: Cannot write to ${filename}`,
                );
            } else if (writeError.code === 'ENOSPC') {
                throw new Error('Insufficient disk space to write file');
            } else if (
                writeError.code === 'EMFILE' ||
                writeError.code === 'ENFILE'
            ) {
                throw new Error('Too many open files, cannot write file');
            } else {
                throw new Error(
                    `Failed to write file ${filename}: ${writeError.message}`,
                );
            }
        }
    }
    async _ensure_zones() {
        try {
            logger.info('Ensuring required zones exist for synchronous client');
            const results = await this.zoneManager.ensureRequiredZones(
                this.webUnlockerZone,
                this.serpZone,
            );

            if (results.web_unlocker.created || results.serp.created) {
                logger.info(
                    'Zone auto-creation completed successfully',
                    results,
                );
            }
        } catch (e: any) {
            logger.warning(
                `Zone auto-creation failed: ${e.message}. Continuing with existing zones.`,
            );
        }
    }
    async list_zones(): Promise<ZoneInfo[]> {
        try {
            return await this.zoneManager.list_zones();
        } catch (e: any) {
            logger.error(`Failed to list zones: ${e.message}`);
            return [];
        }
    }
}
