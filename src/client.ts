import fs from 'fs';
import path from 'path';
import { WebScraper } from './api/scrape';
import { SearchAPI } from './api/search';
import { ZoneManager } from './utils/zone-manager';
import { setupLogging, getLogger } from './utils/logging-config';
import {
    DEFAULT_WEB_UNLOCKER_ZONE,
    DEFAULT_SERP_ZONE,
} from './utils/constants';
import { ValidationError } from './exceptions/errors';
import { isTrueLike, maskKey } from './utils/misc';
import {
    ClientOptionsSchema,
    ApiKeySchema,
    ScrapeOptionsSchema,
    SearchOptionsSchema,
    SearchQueryParamSchema,
    URLParamSchema,
    assertSchema,
} from './schemas';
import type {
    ZoneInfo,
    ScrapeOptions,
    SearchOptions,
    BdClientOptions,
} from './types';

const logger = getLogger('client');

/**
 * Create a new bdclient instance
 *
 * @param opt Configuration options for the client
 *
 * @example
 * ```javascript
 * // Basic usage
 * const client = new bdclient({
 *     api_token: 'your-api-token'
 * });
 *
 * // Advanced configuration
 * const client = new bdclient({
 *     api_token: 'brd-customer-hl_12345-zone-web:abc123',
 *     auto_create_zones: true,
 *     web_unlocker_zone: 'my_web_zone',
 *     serp_zone: 'my_serp_zone',
 *     log_level: 'DEBUG',
 *     verbose: true
 * });
 *
 * // Using environment variables
 * process.env.BRIGHTDATA_API_TOKEN = 'your-token';
 * const client = new bdclient(); // Automatically uses env var
 * ```
 */
export class bdclient {
    private webScraper: WebScraper;
    private searchApi: SearchAPI;
    private zoneManager: ZoneManager;

    constructor(options: BdClientOptions) {
        const opt = assertSchema(ClientOptionsSchema, options || {});
        const isVerbose = opt.verbose
            ? opt.verbose
            : isTrueLike(process.env.BRIGHTDATA_VERBOSE || '');
        setupLogging(opt.logLevel, opt.structuredLogging, isVerbose);
        logger.info('Initializing Bright Data SDK client');

        const apiKey = assertSchema(
            ApiKeySchema,
            opt.apiKey || process.env.BRIGHTDATA_API_KEY,
        );

        logger.info(`API key validated successfully: ${maskKey(apiKey)}`);
        logger.info('HTTP client configured with secure headers');

        this.zoneManager = new ZoneManager({ apiKey });
        this.webScraper = new WebScraper({
            apiKey,
            zoneManager: this.zoneManager,
            autoCreateZones: opt.autoCreateZones,
            zone:
                opt.webUnlockerZone ||
                process.env.WEB_UNLOCKER_ZONE ||
                DEFAULT_WEB_UNLOCKER_ZONE,
        });
        this.searchApi = new SearchAPI({
            apiKey,
            zoneManager: this.zoneManager,
            autoCreateZones: opt.autoCreateZones,
            zone: opt.serpZone || process.env.SERP_ZONE || DEFAULT_SERP_ZONE,
        });
    }
    /**
     * Scrape a single URL using Bright Data Web Unlocker API
     *
     * Bypasses anti-bot protection and returns website content
     *
     * @param url Single URL string to scrape
     * @param opt Scraping options
     * @returns Promise resolving to scraped data (HTML string or JSON object)
     *
     * @example
     * ```javascript
     * // Simple scraping (returns HTML)
     * const html =  await client.scrape('https://example.com');
     *
     * // Get structured JSON data
     * const data =  await client.scrape('https://example.com', {
     *     responseFormat: 'json'
     * });
     *
     * // Advanced options
     * const result =  await client.scrape('https://example.com', {
     *     method: 'GET',                 // 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
     *     country: 'us',                 // 'us' | 'gb' | 'de' | 'jp' etc.
     *     responseFormat: 'raw',         // 'raw' | 'json'
     *     dataFormat: 'markdown',        // 'markdown' | 'screenshot'
     *     timeout: 30000,                // 5000-300000 milliseconds
     *     zone: 'my_custom_zone'         // Custom zone name
     * });
     *
     * // E-commerce scraping
     * const productData =  await client.scrape('https://amazon.com/dp/B123', {
     *     responseFormat: 'json',
     *     country: 'us'
     * });
     * ```
     */
    async scrape(url: string | string[], options: ScrapeOptions = {}) {
        const safeUrl = assertSchema(URLParamSchema, url);
        const safeOptions = assertSchema(ScrapeOptionsSchema, options);

        logger.info(
            'Starting scrape operation for ' +
                `${Array.isArray(url) ? url.length : 1} URL(s)`,
        );

        return this.webScraper.scrape(safeUrl, safeOptions);
    }
    /**
     * Search using a single query via Bright Data SERP API
     *
     * Performs web search on Google, Bing, or Yandex with anti-bot protection bypass
     *
     * @param query Search query string
     * @param opt Search options
     * @returns Promise resolving to search results (HTML or structured data)
     *
     * @example
     * ```javascript
     * // Simple Google search
     * const results =  await client.search('pizza restaurants');
     *
     * // Structured search results
     * const data =  await client.search('best laptops 2024', {
     *     responseFormat: 'json'
     * });
     *
     * // Advanced search options
     * const results =  await client.search('machine learning courses', {
     *     searchEngine: 'bing',         // 'google' | 'bing' | 'yandex'
     *     country: 'us',                 // 'us' | 'gb' | 'de' | 'jp' etc.
     *     responseFormat: 'json',        // 'raw' | 'json'
     *     dataFormat: 'markdown',        // 'markdown' | 'screenshot'
     *     timeout: 20000,                // 5000-300000 milliseconds
     *     zone: 'my_serp_zone'           // Custom zone
     * });
     *
     * // Different search engines
     * const googleResults =  await client.search('nodejs tutorial', {
     *     searchEngine: 'google',
     *     country: 'us'
     * });
     *
     * const bingResults =  await client.search('nodejs tutorial', {
     *     searchEngine: 'bing',
     *     country: 'us'
     * });
     *
     * const yandexResults =  await client.search('nodejs tutorial', {
     *     searchEngine: 'yandex',
     *     country: 'ru'
     * });
     * ```
     */
    async search(query: string | string[], options: SearchOptions = {}) {
        const safeQuery = assertSchema(SearchQueryParamSchema, query);
        const safeOptions = assertSchema(SearchOptionsSchema, options);

        logger.info(
            'Starting search operation for ' +
                `${Array.isArray(safeQuery) ? safeQuery.length : 1} safeQuery/queries`,
        );

        return this.searchApi.search(safeQuery, safeOptions);
    }
    /**
     * Download content to a local file
     *
     * Saves scraped data or search results to disk in various formats
     *
     * @param content Content to save (any data structure)
     * @param filename Output filename (auto-generated if null)
     * @param format File format (default: 'json')
     * @returns Promise resolving to the file path where content was saved
     *
     * @example
     * ```javascript
     * // Save scraped data as JSON
     * const data =  await client.scrape('https://example.com');
     * const filePath =  await client.downloadContent(data, 'scraped_data.json', 'json');
     *
     * // Auto-generate filename
     * const filePath =  await client.downloadContent(data, null, 'json');
     * // Creates: brightdata_content_2024-01-15T10-30-45-123Z.json
     *
     * // Save as CSV (for array of objects)
     * const products =  await client.scrape(productUrls, { response_format: 'json' });
     * const csvPath =  await client.downloadContent(products, 'products.csv', 'csv');
     *
     * // Save as plain text
     * const html =  await client.scrape('https://example.com');
     * const txtPath =  await client.downloadContent(html, 'page.txt', 'txt');
     *
     * // Different formats
     *  await client.downloadContent(data, 'data.json', 'json');  // JSON format
     *  await client.downloadContent(data, 'data.csv', 'csv');    // CSV format
     *  await client.downloadContent(data, 'data.txt', 'txt');    // Text format
     * ```
     */
    downloadContent(
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
    /**
     * List all active zones in your Bright Data account
     *
     * Retrieves information about available proxy zones and their status
     *
     * @returns Promise resolving to array of zone objects with details
     *
     * @example
     * ```javascript
     * // List all zones
     * const zones =  await client.listZones();
     *
     * // Process zone information
     * for (let zone of zones) {
     *     console.log(`Zone: ${zone.name}`);
     *     console.log(`Type: ${zone.type}`);
     *     console.log(`Status: ${zone.status}`);
     *     console.log(`IPs: ${zone.ips}`);
     *     console.log(`Bandwidth: ${zone.bandwidth}`);
     *     console.log('---');
     * };
     *
     * // Find specific zone
     * const webZone = zones.find(z => z.name === 'web_unlocker_1');
     * if (webZone) {
     *     console.log(`Found zone: ${webZone.name}, Status: ${webZone.status}`);
     * }
     *
     * // Check zone availability
     * const activeZones = zones.filter(z => z.status === 'active');
     * console.log(`Active zones: ${activeZones.length}`);
     * ```
     */
    async listZones(): Promise<ZoneInfo[]> {
        try {
            return await this.zoneManager.listZones();
        } catch (e: any) {
            logger.error(`Failed to list zones: ${e.message}`);
            return [];
        }
    }
}
