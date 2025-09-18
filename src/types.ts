export interface ZoneInfo {
    name: string;
    type: string;
    ips: number;
    bandwidth: number;
    created?: string;
    status?: string;
}

export type ZoneInfoResponse = ZoneInfo & {
    zone_type?: string;
    created_at?: string;
    zone?: string;
};

export interface FetchingOptions {
    /**
     * Maximum parallel workers for multiple URLs (default: 10)
     * Range: 1-50 workers
     * @example 1 | 5 | 10 | 20 | 50
     */
    maxWorkers?: number;
    /**
     * Request timeout in milliseconds (default: 30000)
     * Range: 1000-300000 ms (1 second to 5 minutes)
     * @example 5000 | 10000 | 30000 | 60000 | 120000
     */
    timeout?: number;
}

export type ScrapeOptions = {
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
    responseFormat?: 'json' | 'raw';
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
    dataFormat?: 'markdown' | 'html' | 'text' | 'json';
} & FetchingOptions;

export type SearchEngine = 'google' | 'bing' | 'yandex';

export type SearchOptions = {
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
    searchEngine?: SearchEngine;
    /**
     * Response format (default: "raw")
     * Available values:
     * - "raw": Returns HTML string of search results page
     * - "json": Returns structured search results object
     */
    responseFormat?: 'json' | 'raw';
    /**
     * Additional format transformation (default: "markdown")
     * Available values: 'markdown' | 'html' | 'text' | 'json'
     */
    dataFormat?: 'markdown' | 'html' | 'text' | 'json';
    /**
     * Two-letter ISO country code for search region (default: "")
     * @example 'us' | 'gb' | 'de' | 'jp' | 'au' | 'ca' | 'fr' | 'it' | 'es' | 'br' | 'in' | ''
     */
    country?: string;
} & FetchingOptions;
