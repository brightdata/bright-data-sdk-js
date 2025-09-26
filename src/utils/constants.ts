import fs from 'node:fs';
import path from 'node:path';

let version: string;
try {
    const packagePath = path.join(__dirname, '../../../package.json');
    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as {
        version: string;
    };
    version = packageData.version;
} catch {
    version = 'dev';
}

// Version and User-Agent
export const PACKAGE_VERSION = version;
export const USER_AGENT = `brightdata-sdk-js/${PACKAGE_VERSION}`;

// API Configuration
export const DEFAULT_CONCURRENCY = 10;
export const DEFAULT_TIMEOUT = 30_000;
export const MAX_RETRIES = 3;
export const RETRY_BACKOFF_FACTOR = 1.5;
export const RETRY_STATUSES = [429, 500, 502, 503, 504];

const API_BASE_URL = 'https://api.brightdata.com';

export const API_ENDPOINT = {
    REQUEST: `${API_BASE_URL}/request`,
    ZONE: `${API_BASE_URL}/zone`,
    ZONE_LIST: `${API_BASE_URL}/zone/get_active_zones`,
};

export const DEFAULT_WEB_UNLOCKER_ZONE = 'sdk_unlocker';
export const DEFAULT_SERP_ZONE = 'sdk_serp';
