import { ScrapeAPI } from './api/scrape.js';
import { SearchAPI } from './api/search.js';
import { ZonesAPI } from './api/zones.js';
import { setup as setupLogger, getLogger } from './utils/logger.js';
import {
    DEFAULT_WEB_UNLOCKER_ZONE,
    DEFAULT_SERP_ZONE,
} from './utils/constants.js';
import { ValidationError } from './utils/errors.js';
import { maskKey } from './utils/misc.js';
import { writeContent, stringifyResults, getFilename } from './utils/files.js';
import {
    ClientOptionsSchema,
    ApiKeySchema,
    ScrapeOptionsSchema,
    SearchOptionsSchema,
    SearchQueryParamSchema,
    URLParamSchema,
    VerboseSchema,
    SaveOptionsSchema,
    assertSchema,
} from './schemas.js';
import type {
    ZoneInfo,
    BdClientOptions,
    SaveOptions,
    ScrapeJSONOptions,
    SearchJSONOptions,
    SingleJSONResponse,
    BatchJSONResponse,
    ScrapeOptions,
    SearchOptions,
    SingleRawResponse,
    BatchRawResponse,
    AnyResponse,
} from './types.js';

/**
 * Create a new bdclient instance
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
 * process.env.BRIGHTDATA_API_KEY = 'your-key';
 * const client = new bdclient(); // Automatically uses env var
 * ```
 */
export class bdclient {
    private scrapeAPI: ScrapeAPI;
    private searchAPI: SearchAPI;
    private zonesAPI: ZonesAPI;
    private logger!: ReturnType<typeof getLogger>;

    constructor(options?: BdClientOptions) {
        const opt = assertSchema(
            ClientOptionsSchema,
            options || {},
            'bdclient.options',
        );
        const {
            BRIGHTDATA_API_KEY,
            BRIGHTDATA_VERBOSE,
            BRIGHTDATA_WEB_UNLOCKER_ZONE,
            BRIGHTDATA_SERP_ZONE,
        } = process.env;

        const isVerbose = opt.verbose
            ? opt.verbose
            : assertSchema(
                  VerboseSchema,
                  BRIGHTDATA_VERBOSE || '0',
                  'bdclient.options.verbose',
              );

        this.logger = getLogger('client');
        setupLogger(opt.logLevel, opt.structuredLogging, isVerbose);
        this.logger.info('initializing Bright Data SDK client');

        const apiKey = assertSchema(
            ApiKeySchema,
            opt.apiKey || BRIGHTDATA_API_KEY,
            'bdclient.options.apiKey',
        );

        this.logger.info(`API key validated successfully: ${maskKey(apiKey)}`);
        this.logger.info('HTTP client configured with secure headers');

        this.zonesAPI = new ZonesAPI({ apiKey });
        this.scrapeAPI = new ScrapeAPI({
            apiKey,
            zonesAPI: this.zonesAPI,
            autoCreateZones: opt.autoCreateZones,
            zone:
                opt.webUnlockerZone ||
                BRIGHTDATA_WEB_UNLOCKER_ZONE ||
                DEFAULT_WEB_UNLOCKER_ZONE,
        });
        this.searchAPI = new SearchAPI({
            apiKey,
            zonesAPI: this.zonesAPI,
            autoCreateZones: opt.autoCreateZones,
            zone: opt.serpZone || BRIGHTDATA_SERP_ZONE || DEFAULT_SERP_ZONE,
        });
    }
    /**
     * Scrape a single URL using Bright Data Web Unlocker API
     *
     * Bypasses anti-bot protection and returns website content
     *
     * @example
     * ```javascript
     * // Simple scraping (returns HTML)
     * const html = await client.scrape('https://example.com');
     *
     * // Get structured JSON data
     * const data = await client.scrape('https://example.com', {
     *     format: 'json'
     * });
     *
     * // Advanced options
     * const result = await client.scrape('https://example.com', {
     *     method: 'GET',                 // 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
     *     country: 'us',                 // 'us' | 'gb' | 'de' | 'jp' etc.
     *     format: 'raw',                 // 'raw' | 'json'
     *     dataFormat: 'markdown',        // 'html' | 'markdown' | 'screenshot'
     *     timeout: 30000,                // 5000-300000 milliseconds
     *     zone: 'my_custom_zone'         // Custom zone name
     * });
     *
     * // E-commerce scraping
     * const productData = await client.scrape('https://amazon.com/dp/B123', {
     *     format: 'json',
     *     country: 'us'
     * });
     * ```
     */
    // prettier-ignore
    async scrape(url: string, opts?: ScrapeJSONOptions): Promise<SingleJSONResponse>;
    // prettier-ignore
    async scrape(url: string, opts?: ScrapeOptions): Promise<SingleRawResponse>;
    // prettier-ignore
    async scrape(url: string[], opts?: ScrapeJSONOptions): Promise<BatchJSONResponse>;
    // prettier-ignore
    async scrape(url: string[], opts?: ScrapeOptions): Promise<BatchRawResponse>;
    async scrape(
        url: string | string[],
        options: ScrapeOptions | ScrapeJSONOptions = {},
    ): Promise<AnyResponse> {
        const label = 'bdclient.scrape.';
        const safeUrl = assertSchema(URLParamSchema, url, `${label}url`);
        const safeOptions = assertSchema(
            ScrapeOptionsSchema,
            options,
            `${label}options`,
        );

        this.logger.info(
            'starting scrape operation for ' +
                `${Array.isArray(url) ? url.length : 1} URL(s)`,
        );

        return Array.isArray(safeUrl)
            ? this.scrapeAPI.handle(safeUrl, safeOptions)
            : this.scrapeAPI.handle(safeUrl, safeOptions);
    }
    /**
     * Search using a single query via Bright Data SERP API
     *
     * Performs web search on Google, Bing, or Yandex with anti-bot protection bypass
     *
     * @example
     * ```javascript
     * // Simple Google search
     * const results = await client.search('pizza restaurants');
     *
     * // Structured search results
     * const data = await client.search('best laptops 2024', {
     *     format: 'json'
     * });
     *
     * // Advanced search options
     * const results = await client.search('machine learning courses', {
     *     searchEngine: 'bing',          // 'google' | 'bing' | 'yandex'
     *     country: 'us',                 // 'us' | 'gb' | 'de' | 'jp' etc.
     *     format: 'json',                // 'raw' | 'json'
     *     dataFormat: 'markdown',        // 'html' | 'markdown' | 'screenshot'
     *     timeout: 20000,                // 5000-300000 milliseconds
     *     zone: 'my_serp_zone'           // Custom zone
     * });
     *
     * // Different search engines
     * const googleResults = await client.search('nodejs tutorial', {
     *     searchEngine: 'google',
     *     country: 'us'
     * });
     *
     * const bingResults = await client.search('nodejs tutorial', {
     *     searchEngine: 'bing',
     *     country: 'us'
     * });
     *
     * const yandexResults = await client.search('nodejs tutorial', {
     *     searchEngine: 'yandex',
     *     country: 'ru'
     * });
     * ```
     */
    // prettier-ignore
    async search(query: string, options: SearchJSONOptions): Promise<SingleJSONResponse>;
    // prettier-ignore
    async search(query: string, options?: SearchOptions): Promise<SingleRawResponse>;
    // prettier-ignore
    async search(query: string[], options: SearchJSONOptions): Promise<BatchJSONResponse>;
    // prettier-ignore
    async search(query: string[], options?: SearchOptions): Promise<BatchRawResponse>;
    async search(
        query: string | string[],
        options?: SearchOptions | SearchJSONOptions,
    ): Promise<AnyResponse> {
        const label = 'bdclient.search.';
        const safeQuery = assertSchema(
            SearchQueryParamSchema,
            query,
            `${label}url`,
        );
        const safeOptions = assertSchema(
            SearchOptionsSchema,
            options || {},
            `${label}url`,
        );

        this.logger.info(
            'starting search operation for ' +
                `${Array.isArray(safeQuery) ? safeQuery.length : 1} query/queries`,
        );

        return Array.isArray(safeQuery)
            ? this.searchAPI.handle(safeQuery, safeOptions)
            : this.searchAPI.handle(safeQuery, safeOptions);
    }
    /**
     * Write content to a local file
     *
     * Saves scraped data or search results to disk in various formats
     *
     * @example
     * ```javascript
     * // Save scraped data as JSON
     * const data = await client.scrape('https://example.com');
     * const filePath = await client.saveResults(data, {
     *     filename: 'scraped_data.json',
     *     format: 'json',
     * });
     *
     * // Auto-generate filename
     * const filePath = await client.saveResults(data);
     * // Creates: brightdata_content_1758705609651.json
     *
     * // Save as plain text
     * const html = await client.scrape('https://example.com');
     * const txtPath = await client.saveResults(html, {
     *     filename: 'page.txt',
     *     format: 'txt',
     * });
     *
     * // Different formats
     *  await client.saveResults(data, {
     *     filename: 'data.json',
     *     format: 'json', // JSON format
     * });
     *  await client.saveResults(data, {
     *      filename: 'data.txt',
     *      format: 'txt', // Text format
     *  });
     * ```
     */
    async saveResults(content: AnyResponse, options: SaveOptions = {}) {
        if (!content) {
            throw new ValidationError('content is required');
        }

        const { format, filename } = assertSchema(SaveOptionsSchema, options);
        const fname = getFilename(filename, format);
        this.logger.info(`saving ${fname}`);
        const data = stringifyResults(content, format);
        return await writeContent(data, fname);
    }
    /**
     * List all active zones in your Bright Data account
     *
     * Retrieves information about available proxy zones and their status
     *
     * @example
     * ```javascript
     * // List all zones
     * const zones = await client.listZones();
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
        return await this.zonesAPI.listZones();
    }
}
