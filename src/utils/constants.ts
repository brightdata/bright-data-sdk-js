import fs from 'fs';
import path from 'path';

// Read version from package.json
let version;
try {
    const packagePath = path.join(__dirname, '../../package.json');
    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    version = packageData.version;
} catch (e) {
    // Fallback version if package.json can't be read
    version = '1.1.0';
}

// Version and User-Agent
export const PACKAGE_VERSION = version;
export const USER_AGENT = `brightdata-sdk-js/${PACKAGE_VERSION}`;

// API Configuration
export const DEFAULT_MAX_WORKERS = 10;
export const DEFAULT_TIMEOUT = 30000;
export const CONNECTION_POOL_SIZE = 20;
export const MAX_RETRIES = 3;
export const RETRY_BACKOFF_FACTOR = 1.5;
export const RETRY_STATUSES = new Set([429, 500, 502, 503, 504]);

// API Endpoints
export const API_BASE_URL = 'https://api.brightdata.com';
export const ZONE_API_URL = `${API_BASE_URL}/zone`;
export const REQUEST_API_URL = `${API_BASE_URL}/request`;

// Default Zone Names
export const DEFAULT_WEB_UNLOCKER_ZONE = 'sdk_unlocker';
export const DEFAULT_SERP_ZONE = 'sdk_serp';
