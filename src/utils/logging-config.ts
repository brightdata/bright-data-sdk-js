type LOG_LEVEL = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

let current_log_level: LOG_LEVEL = 'INFO';
let is_structured_logging = true;
let is_verbose = false;

const log_levels: Record<LOG_LEVEL, number> = {
    DEBUG: 0,
    INFO: 1,
    WARNING: 2,
    ERROR: 3,
    CRITICAL: 4,
};

export function setupLogging(
    log_level: LOG_LEVEL = 'INFO',
    structured_logging = true,
    verbose = false,
) {
    current_log_level = log_level.toUpperCase() as LOG_LEVEL;
    is_structured_logging = structured_logging;
    is_verbose = verbose;
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
    const current_level_value =
        log_levels[current_log_level] || log_levels.INFO;
    const message_level_value = log_levels[level] || log_levels.INFO;
    if (!is_verbose && message_level_value < log_levels.WARNING) return;
    if (message_level_value < current_level_value) return;
    const timestamp = new Date().toISOString();
    if (is_structured_logging) {
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

export function safeJsonParse(data: unknown) {
    if (typeof data == 'string') {
        try {
            return JSON.parse(data);
        } catch (e: any) {
            const logger = getLogger('utils.json');
            logger.warning(
                'Failed to parse JSON response, returning as ' + 'string',
                {
                    error: e.message,
                    data:
                        data.substring(0, 200) +
                        (data.length > 200 ? '...' : ''),
                },
            );
            return data;
        }
    }
    return data;
}

export function validateResponseSize(data: unknown) {
    const max_size = 50 * 1024 * 1024;
    let data_size;
    if (typeof data == 'string') data_size = Buffer.byteLength(data, 'utf8');
    else if (Buffer.isBuffer(data)) data_size = data.length;
    else data_size = Buffer.byteLength(JSON.stringify(data), 'utf8');
    if (data_size > max_size)
        throw new Error(
            `Response size (${Math.round(data_size / 1024 / 1024)}MB) ` +
                'exceeds maximum allowed size (50MB)',
        );
}
