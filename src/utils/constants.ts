export const PACKAGE_VERSION = process.env.BRD_PACKAGE_VERSION || 'dev';
export const USER_AGENT = `brightdata-sdk-js/${PACKAGE_VERSION}`;

// API Configuration
export const DEFAULT_CONCURRENCY = 10;
export const DEFAULT_TIMEOUT = 120_000;
export const MAX_RETRIES = 3;
export const RETRY_BACKOFF_FACTOR = 1.5;
export const RETRY_STATUSES = [429, 500, 502, 503, 504];

const API_BASE_URL = 'https://api.brightdata.com';

export const API_ENDPOINT = {
    REQUEST: `${API_BASE_URL}/request`,
    ZONE: `${API_BASE_URL}/zone`,
    ZONE_LIST: `${API_BASE_URL}/zone/get_active_zones`,
    SCRAPE_ASYNC: `${API_BASE_URL}/datasets/v3/trigger`,
    SCRAPE_SYNC: `${API_BASE_URL}/datasets/v3/scrape`,
    SNAPSHOT_STATUS: `${API_BASE_URL}/datasets/v3/progress/{snapshot_id}`,
    SNAPSHOT_DOWNLOAD: `${API_BASE_URL}/datasets/v3/snapshot/{snapshot_id}`,
    SNAPSHOT_DELIVER: `${API_BASE_URL}/datasets/v3/deliver/{snapshot_id}`,
};

export const DEFAULT_WEB_UNLOCKER_ZONE = 'sdk_unlocker';
export const DEFAULT_SERP_ZONE = 'sdk_serp';
