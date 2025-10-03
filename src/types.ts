import type { BRDError } from './utils/errors';

export type ZoneType =
    | 'dc'
    | 'serp'
    | 'unblocker'
    | 'res_rotating'
    | 'res_static'
    | 'browser_api'
    | 'mobile';

export interface ZoneInfo {
    name: string;
    type: ZoneType;
    ips: number;
    bandwidth: number;
    created?: string;
    status?: string;
}

export type ZoneInfoResponse = ZoneInfo & {
    zone_type?: ZoneInfo['type'];
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

export type LOG_LEVEL = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

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
    logLevel?: LOG_LEVEL;
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

export type ContentFormat = 'json' | 'txt';

export interface SaveOptions {
    /**
     * Output filename (optional, auto-generated if not provided)
     * @example "/path/to/output.txt"
     */
    filename?: string;
    /**
     * File format: 'json' | 'txt' (default: 'json')
     * @example "json"
     */
    format?: ContentFormat;
}

export type SnapshotFormat = 'json' | 'ndjson' | 'jsonl' | 'csv';

interface DatasetOptionsBase {
    async?: boolean;
    format?: SnapshotFormat;
    customOutputFields?: string;
    includeErrors?: boolean;
}

export interface DatasetOptionsSync extends DatasetOptionsBase {
    async?: false;
}

export interface DatasetOptionsAsync extends DatasetOptionsBase {
    async: true;
    type?: 'discover_new';
    discoverBy?: string;
    limitPerInput?: number;
    limitMultipleResults?: number;
}

export type DatasetOptions = DatasetOptionsSync | DatasetOptionsAsync;

export interface SnapshotDownloadOptions {
    format?: SnapshotFormat;
    compress?: boolean;
}

export type SnapshotStatus = 'running' | 'ready' | 'failed';

export interface SnapshotMeta {
    snapshot_id: string;
}

export interface SnapshotStatusResponse extends SnapshotMeta {
    dataset_id: string;
    status: SnapshotStatus;
}

export type UnknownRecord = Record<string, unknown>;

export interface UrlFilter extends UnknownRecord {
    url: string;
}

export interface LinkedinProfileFilter extends UnknownRecord {
    first_name?: string;
    last_name?: string;
}

export interface LinkedinJobFilter extends UnknownRecord {
    location?: string;
    keyword?: string;
    country?: string;
    time_range?: 'Past 24 hours' | 'Past week' | 'Past month' | 'Any time';
    job_type?:
        | 'Full-time'
        | 'Part-time'
        | 'Contract'
        | 'Temporary'
        | 'Volunteer';
    experience_level?:
        | 'Internship'
        | 'Entry level'
        | 'Associate'
        | 'Mid-Senior level'
        | 'Director'
        | 'Executive';
    remote?: 'On-site' | 'Remote' | 'Hybrid';
    company?: string;
    location_radius?:
        | 'Exact location'
        | '5 miles (8 km)'
        | '10 miles (16 km)'
        | '25 miles (40 km)'
        | '50 miles (80 km)';
    selective_search?: boolean;
}
