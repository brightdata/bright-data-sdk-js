type LOG_LEVEL = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

let currentLogLevel: LOG_LEVEL = 'INFO';
let isStructuredLogging = true;
let isVerbose = false;

const logLevels: Record<LOG_LEVEL, number> = {
    DEBUG: 0,
    INFO: 1,
    WARNING: 2,
    ERROR: 3,
    CRITICAL: 4,
};

export function setupLogging(
    logLevel: LOG_LEVEL = 'INFO',
    structuredLogging = true,
    verbose = false,
) {
    currentLogLevel = logLevel.toUpperCase() as LOG_LEVEL;
    isStructuredLogging = structuredLogging;
    isVerbose = verbose;
}

export function getLogger(name: string) {
    return {
        debug: (message: string, extra = {}) =>
            log('DEBUG', name, message, extra),
        info: (message: string, extra = {}) =>
            log('INFO', name, message, extra),
        warning: (message: string, extra = {}) =>
            log('WARNING', name, message, extra),
        error: (message: string, extra = {}) =>
            log('ERROR', name, message, extra),
        critical: (message: string, extra = {}) =>
            log('CRITICAL', name, message, extra),
    };
}

function log(level: LOG_LEVEL, name: string, message: string, extra = {}) {
    const current_level_value = logLevels[currentLogLevel] || logLevels.INFO;
    const message_level_value = logLevels[level] || logLevels.INFO;
    if (!isVerbose && message_level_value < logLevels.WARNING) return;
    if (message_level_value < current_level_value) return;
    const timestamp = new Date().toISOString();
    if (isStructuredLogging) {
        const log_entry = {
            timestamp,
            level,
            logger: name,
            message,
            ...extra,
        };
        console.log(JSON.stringify(log_entry));
    } else {
        const formatted_message = `${timestamp} [${level}] ${name}: ${message}`;
        switch (level) {
            case 'DEBUG':
            case 'INFO':
                console.log(formatted_message);
                break;
            case 'WARNING':
                console.warn(formatted_message);
                break;
            case 'ERROR':
            case 'CRITICAL':
                console.error(formatted_message);
                break;
            default:
                console.log(formatted_message);
        }
    }
}

export function logRequest(method: string, url: string, data = {}) {
    const logger = getLogger('http.request');
    logger.debug(`${method} ${url}`, {
        method,
        url,
        data: typeof data == 'object' ? JSON.stringify(data) : data,
    });
}
