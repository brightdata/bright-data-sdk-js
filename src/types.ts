import type { BRDError } from './utils/errors';

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
     * Maximum parallel queries for multiple URLs (default: 10)
     * Range: 1-50 queries
     * @example 1 | 5 | 10 | 20 | 50
     */
    concurrency?: number;
    /**
     * Request timeout in milliseconds (default: 30000)
     * Range: 1000-300000 ms (1 second to 5 minutes)
     * @example 5000 | 10000 | 30000 | 60000 | 120000
     */
    timeout?: number;
}

export type RequestOptions = {
    zone?: string;
    /**
     * Response format (default: "raw")
     * Available values:
     * - "raw": Returns HTML string
     * - "json": Returns structured data object
     */
    format?: 'json' | 'raw';
    /**
     * HTTP method for the request (default: "GET")
     * Available values: 'GET' | 'POST'
     */
    method?: 'GET' | 'POST';
    /**
     * Two-letter ISO country code for proxy location (default: "")
     * @example 'us' | 'gb' | 'de' | 'jp' | 'au' | 'ca' | 'fr' | 'it' | 'es' | ''
     */
    country?: string;
    /**
     * Additional format transformation (default: "html")
     * Available values: 'html' | 'markdown' | 'screenshot'
     */
    dataFormat?: 'html' | 'markdown' | 'screenshot';
} & FetchingOptions;

export type ScrapeOptions = {
    /**
     * Zone identifier (default: auto-configured web_unlocker_zone)
     * @example 'web_unlocker_1' | 'my_scraping_zone'
     */
    zone?: string;
} & RequestOptions;

export type SearchEngine = 'google' | 'bing' | 'yandex';

export type SearchOptions = {
    /**
     * Search engine to use (default: "google")
     * Available values:
     * - "google": Google Search
     * - "bing": Microsoft Bing
     * - "yandex": Yandex Search
     */
    searchEngine?: SearchEngine;
    /**
     * Zone identifier (default: auto-configured serp_zone)
     * @example 'serp_api_1' | 'my_search_zone'
     */
    zone?: string;
} & RequestOptions;

export interface BdClientOptions {
    /**
     * Your Bright Data API key (can also be set via BRIGHTDATA_API_KEY env var)
     * @example 'brd-customer-hl_12345678-zone-web_unlocker:abc123xyz'
     */
    apiKey?: string;
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

export interface JSONResponse {
    status_code: number;
    headers: Record<string, string>;
    body: string;
}

export type SingleResponse = string | JSONResponse;
export type BatchResponse = Array<SingleResponse | BRDError>;
