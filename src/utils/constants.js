'use strict'; /*jslint node:true*/

const fs = require('fs');
const path = require('path');

// Read version from package.json
let PACKAGE_VERSION;
try {
    const packagePath = path.join(__dirname,'../../package.json');
    const packageData = JSON.parse(fs.readFileSync(packagePath,'utf8'));
    PACKAGE_VERSION = packageData.version;
} catch (e) {
    // Fallback version if package.json can't be read
    PACKAGE_VERSION = '1.1.0';
}

const E = module.exports;

// Version and User-Agent
E.PACKAGE_VERSION = PACKAGE_VERSION;
E.USER_AGENT = `brightdata-sdk-js/${PACKAGE_VERSION}`;

// API Configuration
E.DEFAULT_MAX_WORKERS = 10;
E.DEFAULT_TIMEOUT = 30000;
E.CONNECTION_POOL_SIZE = 20;
E.MAX_RETRIES = 3;
E.RETRY_BACKOFF_FACTOR = 1.5;
E.RETRY_STATUSES = new Set([429,500,502,503,504]);

// API Endpoints
E.API_BASE_URL = 'https://api.brightdata.com';
E.ZONE_API_URL = 'https://api.brightdata.com/zone';
E.REQUEST_API_URL = 'https://api.brightdata.com/request';

// Default Zone Names
E.DEFAULT_WEB_UNLOCKER_ZONE = 'sdk_unlocker';
E.DEFAULT_SERP_ZONE = 'sdk_serp';