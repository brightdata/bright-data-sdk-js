import type { BRDError } from '../utils/errors';

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

export interface RequestJSONOptions extends RequestOptions {
    format: 'json';
}

export interface ScrapeOptions extends RequestOptions {
    /**
     * Zone identifier (default: auto-configured web_unlocker_zone)
     * @example 'web_unlocker_1' | 'my_scraping_zone'
     */
    zone?: string;
}

export type ScrapeJSONOptions = ScrapeOptions & RequestJSONOptions;

export type SearchEngine = 'google' | 'bing' | 'yandex';

export interface SearchOptions extends RequestOptions {
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
}

export type SearchJSONOptions = SearchOptions & RequestJSONOptions;

export type SingleRawResponse = string;
export interface SingleJSONResponse {
    status_code: number;
    headers: Record<string, string>;
    body: string;
}

export type BatchJSONResponse = Array<SingleJSONResponse | BRDError>;
export type BatchRawResponse = Array<SingleRawResponse | BRDError>;

export type SingleResponse = SingleRawResponse | SingleJSONResponse;
export type BatchResponse = BatchRawResponse | BatchJSONResponse;
export type AnyResponse = SingleResponse | BatchResponse;
