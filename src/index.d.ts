/**
 * Bright Data SDK for JavaScript/Node.js
 * 
 * A comprehensive SDK for Bright Data's Web Scraping and SERP APIs, providing
 * easy-to-use methods for web scraping, search engine result parsing, and data management.
 */

/**
 * Configuration options for BdClient constructor
 */
export interface BdClientOptions {
    /** 
     * Your Bright Data API token (can also be set via BRIGHTDATA_API_TOKEN env var)
     * @example 'brd-customer-hl_12345678-zone-web_unlocker:abc123xyz'
     */
    api_token?: string;
    /** 
     * Automatically create required zones if they don't exist (default: true)
     * @example true | false
     */
    auto_create_zones?: boolean;
    /** 
     * Custom zone name for web unlocker (default: from env or 'sdk_unlocker')
     * @example 'my_web_zone' | 'web_unlocker_1' | 'scraping_zone'
     */
    web_unlocker_zone?: string;
    /** 
     * Custom zone name for SERP API (default: from env or 'sdk_serp')
     * @example 'my_serp_zone' | 'search_zone' | 'serp_api_1'
     */
    serp_zone?: string;
    /** 
     * Log level (default: 'INFO')
     * Available values: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
     */
    log_level?: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
    /** 
     * Use structured JSON logging (default: true)
     * @example true (JSON format) | false (plain text)
     */
    structured_logging?: boolean;
    /** 
     * Enable verbose logging (default: false)
     * @example true | false
     */
    verbose?: boolean;
}

/**
 * Options for scraping operations
 */
export interface ScrapeOptions {
    /** 
     * Zone identifier (default: auto-configured web_unlocker_zone)
     * @example 'web_unlocker_1' | 'my_scraping_zone'
     */
    zone?: string;
    /** 
     * Response format (default: "raw")
     * Available values:
     * - "raw": Returns HTML string
     * - "json": Returns structured data object
     */
    response_format?: 'json' | 'raw';
    /** 
     * HTTP method for the request (default: "GET")
     * Available values: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
     */
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    /** 
     * Two-letter ISO country code for proxy location (default: "")
     * @example 'us' | 'gb' | 'de' | 'jp' | 'au' | 'ca' | 'fr' | 'it' | 'es' | ''
     */
    country?: string;
    /** 
     * Additional format transformation (default: "markdown")
     * Available values: 'markdown' | 'html' | 'text' | 'json'
     */
    data_format?: string;
    /** 
     * Enable asynchronous processing (default: false)
     * @example true | false
     */
    async_request?: boolean;
    /** 
     * Maximum parallel workers for multiple URLs (default: 10)
     * Range: 1-50 workers
     * @example 1 | 5 | 10 | 20 | 50
     */
    max_workers?: number;
    /** 
     * Request timeout in milliseconds (default: 30000)
     * Range: 1000-300000 ms (1 second to 5 minutes)
     * @example 5000 | 10000 | 30000 | 60000 | 120000
     */
    timeout?: number;
}

/**
 * Options for search operations
 */
export interface SearchOptions {
    /** 
     * Zone identifier (default: auto-configured serp_zone)
     * @example 'serp_api_1' | 'my_search_zone'
     */
    zone?: string;
    /** 
     * Search engine to use (default: "google")
     * Available values:
     * - "google": Google Search
     * - "bing": Microsoft Bing
     * - "yandex": Yandex Search
     */
    search_engine?: 'google' | 'bing' | 'yandex';
    /** 
     * Response format (default: "raw")
     * Available values:
     * - "raw": Returns HTML string of search results page
     * - "json": Returns structured search results object
     */
    response_format?: 'json' | 'raw';
    /** 
     * Two-letter ISO country code for search region (default: "")
     * @example 'us' | 'gb' | 'de' | 'jp' | 'au' | 'ca' | 'fr' | 'it' | 'es' | 'br' | 'in' | ''
     */
    country?: string;
    /** 
     * Maximum parallel workers for multiple queries (default: 10)
     * Range: 1-50 workers
     * @example 1 | 3 | 5 | 10 | 20
     */
    max_workers?: number;
    /** 
     * Request timeout in milliseconds (default: 30000)
     * Range: 1000-300000 ms (1 second to 5 minutes)
     * @example 5000 | 15000 | 30000 | 45000 | 60000
     */
    timeout?: number;
}

/**
 * Zone information object
 */
export interface ZoneInfo {
    name: string;
    type: string;
    status: string;
    ips: number;
    bandwidth: number;
    created: string;
}

/**
 * Main client for the Bright Data SDK
 * 
 * @example
 * ```javascript
 * // Initialize client
 * const client = new bdclient({
 *     api_token: 'brd-customer-hl_12345-zone-web:abc123'
 * });
 * 
 * // Simple scraping
 * const html =  client.scrape('https://example.com');
 * 
 * // Advanced scraping
 * const data =  client.scrape('https://example.com', {
 *     response_format: 'json',
 *     country: 'us',
 *     method: 'GET'
 * });
 * 
 * // Multiple URLs
 * const results =  client.scrape([
 *     'https://example.com',
 *     'https://test.com'
 * ], { max_workers: 5 });
 * 
 * // Search operations
 * const searchResults =  client.search('pizza restaurants', {
 *     search_engine: 'google',
 *     country: 'us',
 *     response_format: 'json'
 * });
 * ```
 */
export declare class bdclient {
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
    constructor(opt?: BdClientOptions);
    
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
     * const html =  client.scrape('https://example.com');
     * 
     * // Get structured JSON data
     * const data =  client.scrape('https://example.com', {
     *     response_format: 'json'
     * });
     * 
     * // Advanced options
     * const result =  client.scrape('https://example.com', {
     *     response_format: 'raw',        // 'raw' | 'json'
     *     method: 'GET',                 // 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
     *     country: 'us',                 // 'us' | 'gb' | 'de' | 'jp' etc.
     *     data_format: 'markdown',       // 'markdown' | 'html' | 'text' | 'json'
     *     timeout: 30000,                // 5000-300000 milliseconds
     *     zone: 'my_custom_zone'         // Custom zone name
     * });
     * 
     * // E-commerce scraping
     * const productData =  client.scrape('https://amazon.com/dp/B123', {
     *     response_format: 'json',
     *     country: 'us'
     * });
     * ```
     */
    scrape(url: string, opt?: ScrapeOptions): string | any;
    
    /**
     * Scrape multiple URLs concurrently using Bright Data Web Unlocker API
     * 
     * Processes multiple websites simultaneously with configurable concurrency
     * 
     * @param urls Array of URLs to scrape
     * @param opt Scraping options applied to all URLs
     * @returns Promise resolving to array of scraped data (one result per input URL)
     * 
     * @example
     * ```javascript
     * // Scrape multiple URLs
     * const urls = [
     *     'https://example.com',
     *     'https://test.com',
     *     'https://demo.com'
     * ];
     * const results =  client.scrape(urls);
     * 
     * // Advanced batch scraping
     * const results =  client.scrape(urls, {
     *     response_format: 'json',       // All URLs return JSON
     *     max_workers: 5,                // Process 5 URLs simultaneously
     *     country: 'us',                 // Use US proxies
     *     timeout: 45000                 // 45 second timeout per URL
     * });
     * 
     * // E-commerce product scraping
     * const productUrls = [
     *     'https://amazon.com/dp/B123',
     *     'https://amazon.com/dp/B456',
     *     'https://amazon.com/dp/B789'
     * ];
     * const products =  client.scrape(productUrls, {
     *     response_format: 'json',
     *     max_workers: 3,
     *     country: 'us'
     * });
     * 
     * // Process results
     * results.forEach((result, index) => {
     *     console.log(`URL ${index + 1}:`, urls[index]);
     *     console.log('Data:', result);
     * });
     * ```
     */
    scrape(urls: string[], opt?: ScrapeOptions): any[];
    
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
     * const results =  client.search('pizza restaurants');
     * 
     * // Structured search results
     * const data =  client.search('best laptops 2024', {
     *     response_format: 'json'
     * });
     * 
     * // Advanced search options
     * const results =  client.search('machine learning courses', {
     *     search_engine: 'bing',         // 'google' | 'bing' | 'yandex'
     *     country: 'us',                 // 'us' | 'gb' | 'de' | 'jp' etc.
     *     response_format: 'json',       // 'raw' | 'json'
     *     timeout: 20000,                // 5000-300000 milliseconds
     *     zone: 'my_serp_zone'           // Custom zone
     * });
     * 
     * // Different search engines
     * const googleResults =  client.search('nodejs tutorial', {
     *     search_engine: 'google',
     *     country: 'us'
     * });
     * 
     * const bingResults =  client.search('nodejs tutorial', {
     *     search_engine: 'bing',
     *     country: 'us'
     * });
     * 
     * const yandexResults =  client.search('nodejs tutorial', {
     *     search_engine: 'yandex',
     *     country: 'ru'
     * });
     * ```
     */
    search(query: string, opt?: SearchOptions): string | any;
    
    /**
     * Search using multiple queries concurrently via Bright Data SERP API
     * 
     * Processes multiple search queries simultaneously with configurable concurrency
     * 
     * @param queries Array of search query strings
     * @param opt Search options applied to all queries
     * @returns Promise resolving to array of search results (one result per query)
     * 
     * @example
     * ```javascript
     * // Multiple search queries
     * const queries = [
     *     'python tutorials',
     *     'machine learning course',
     *     'web development bootcamp',
     *     'data science certification'
     * ];
     * const results =  client.search(queries);
     * 
     * // Advanced batch searching
     * const results =  client.search(queries, {
     *     search_engine: 'google',       // Same engine for all queries
     *     response_format: 'json',       // Structured results
     *     max_workers: 3,                // Process 3 queries simultaneously
     *     country: 'us',                 // US-based search results
     *     timeout: 25000                 // 25 second timeout per query
     * });
     * 
     * // Market research example
     * const competitors = [
     *     'best proxy services 2024',
     *     'web scraping tools comparison',
     *     'data extraction software reviews'
     * ];
     * const marketData =  client.search(competitors, {
     *     search_engine: 'google',
     *     response_format: 'json',
     *     country: 'us',
     *     max_workers: 2
     * });
     * 
     * // Process results
     * results.forEach((result, index) => {
     *     console.log(`Query: "${queries[index]}"`);
     *     console.log('Results:', result);
     * });
     * 
     * // Different search engines for comparison
     * const query = 'best restaurants NYC';
     * const [googleRes, bingRes, yandexRes] =  Promise.all([
     *     client.search([query], { search_engine: 'google' }),
     *     client.search([query], { search_engine: 'bing' }),
     *     client.search([query], { search_engine: 'yandex' })
     * ]);
     * ```
     */
    search(queries: string[], opt?: SearchOptions): any[];
    
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
     * const data =  client.scrape('https://example.com');
     * const filePath =  client.download_content(data, 'scraped_data.json', 'json');
     * 
     * // Auto-generate filename
     * const filePath =  client.download_content(data, null, 'json');
     * // Creates: brightdata_content_2024-01-15T10-30-45-123Z.json
     * 
     * // Save as CSV (for array of objects)
     * const products =  client.scrape(productUrls, { response_format: 'json' });
     * const csvPath =  client.download_content(products, 'products.csv', 'csv');
     * 
     * // Save as plain text
     * const html =  client.scrape('https://example.com');
     * const txtPath =  client.download_content(html, 'page.txt', 'txt');
     * 
     * // Different formats
     *  client.download_content(data, 'data.json', 'json');  // JSON format
     *  client.download_content(data, 'data.csv', 'csv');    // CSV format  
     *  client.download_content(data, 'data.txt', 'txt');    // Text format
     * ```
     */
    download_content(content: any, filename?: string | null, format?: 'json' | 'csv' | 'txt'): string;
    
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
     * const zones =  client.list_zones();
     * 
     * // Process zone information
     * zones.forEach(zone => {
     *     console.log(`Zone: ${zone.name}`);
     *     console.log(`Type: ${zone.type}`);
     *     console.log(`Status: ${zone.status}`);
     *     console.log(`IPs: ${zone.ips}`);
     *     console.log(`Bandwidth: ${zone.bandwidth}`);
     *     console.log('---');
     * });
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
    list_zones(): ZoneInfo[];
}

export declare class BrightDataError extends Error {}
export declare class ValidationError extends BrightDataError {}
export declare class AuthenticationError extends BrightDataError {}
export declare class ZoneError extends BrightDataError {}
export declare class NetworkError extends BrightDataError {}
export declare class APIError extends BrightDataError {
    status_code?: number;
    response_text?: string;
}

export declare const VERSION: string;

export {
    bdclient as default
};

export {
    BrightDataError,
    ValidationError,
    AuthenticationError,
    ZoneError,
    NetworkError,
    APIError
};