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
