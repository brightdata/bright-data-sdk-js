export interface BdClientOptions {
    api_token?: string;
    auto_create_zones?: boolean;
    web_unlocker_zone?: string;
    serp_zone?: string;
    log_level?: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
    structured_logging?: boolean;
    verbose?: boolean;
}

export interface ScrapeOptions {
    zone?: string;
    response_format?: 'json' | 'raw';
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    country?: string;
    data_format?: string;
    async_request?: boolean;
    max_workers?: number;
    timeout?: number;
}

export interface SearchOptions {
    zone?: string;
    search_engine?: 'google' | 'bing' | 'yandex';
    response_format?: 'json' | 'raw';
    country?: string;
    max_workers?: number;
    timeout?: number;
}

export interface ZoneInfo {
    name: string;
    type: string;
    status: string;
    ips: number;
    bandwidth: number;
    created: string;
}

export declare class BdClient {
    constructor(opt?: BdClientOptions);
    
    scrape(url: string, opt?: ScrapeOptions): Promise<any>;
    scrape(urls: string[], opt?: ScrapeOptions): Promise<any[]>;
    
    search(query: string, opt?: SearchOptions): Promise<any>;
    search(queries: string[], opt?: SearchOptions): Promise<any[]>;
    
    download_content(content: any, filename?: string, format?: string): Promise<string>;
    
    list_zones(): Promise<ZoneInfo[]>;
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
    BdClient as bdclient,
    BdClient as default
};

export {
    BrightDataError,
    ValidationError,
    AuthenticationError,
    ZoneError,
    NetworkError,
    APIError
};