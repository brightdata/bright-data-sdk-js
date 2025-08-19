'use strict'; /*jslint node:true*/

const {
    validateUrl,
    validateZoneName,
    validateCountryCode,
    validateTimeout,
    validateMaxWorkers,
    validateUrlList,
    validateSearchEngine,
    validateQuery,
    validateResponseFormat,
    validateHttpMethod
} = require('./validation.js');

const {
    setupLogging,
    getLogger,
    logRequest,
    safeJsonParse,
    validateResponseSize
} = require('./logging-config.js');

const {
    retryRequest,
    retryWithLinearBackoff,
    createRetryWrapper,
    sleep
} = require('./retry.js');

const {ZoneManager} = require('./zone-manager.js');

const E = module.exports;

E.validateUrl = validateUrl;
E.validateZoneName = validateZoneName;
E.validateCountryCode = validateCountryCode;
E.validateTimeout = validateTimeout;
E.validateMaxWorkers = validateMaxWorkers;
E.validateUrlList = validateUrlList;
E.validateSearchEngine = validateSearchEngine;
E.validateQuery = validateQuery;
E.validateResponseFormat = validateResponseFormat;
E.validateHttpMethod = validateHttpMethod;
E.setupLogging = setupLogging;
E.getLogger = getLogger;
E.logRequest = logRequest;
E.safeJsonParse = safeJsonParse;
E.validateResponseSize = validateResponseSize;
E.retryRequest = retryRequest;
E.retryWithLinearBackoff = retryWithLinearBackoff;
E.createRetryWrapper = createRetryWrapper;
E.sleep = sleep;
E.ZoneManager = ZoneManager;