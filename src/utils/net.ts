import {
    type Dispatcher,
    Agent,
    interceptors,
    request as lib_request,
} from 'undici';
import {
    DEFAULT_TIMEOUT,
    MAX_RETRIES,
    RETRY_BACKOFF_FACTOR,
    RETRY_STATUSES,
} from './constants';
import { APIError, AuthenticationError, ValidationError } from './errors';
import { logRequest } from './logger';

const { dns, retry } = interceptors;

interface GetDispatcherOptions {
    timeout?: number;
}

export const getDispatcher = (params: GetDispatcherOptions = {}) => {
    return new Agent({
        headersTimeout: params.timeout || DEFAULT_TIMEOUT,
        bodyTimeout: DEFAULT_TIMEOUT,
    }).compose(
        dns(),
        retry({
            maxRetries: MAX_RETRIES,
            timeoutFactor: RETRY_BACKOFF_FACTOR,
            statusCodes: RETRY_STATUSES,
        }),
    );
};

export const request: typeof lib_request = async (url, opts) => {
    let meta = '';

    if (opts?.query) {
        meta += ` query=${JSON.stringify(opts.query)}`;
    }
    if (opts?.body) {
        if (meta) meta += ' ';
        meta += 'body=';
        meta +=
            typeof opts.body === 'string'
                ? opts.body
                : JSON.stringify(opts.body);
    }

    logRequest(opts?.method || 'GET', JSON.stringify(url), meta);
    return lib_request(url, opts);
};

export async function assertResponse(
    response: Dispatcher.ResponseData,
    parse?: true,
): Promise<string>;
export async function assertResponse(
    response: Dispatcher.ResponseData,
    parse: false,
): Promise<Dispatcher.ResponseData['body']>;
export async function assertResponse(
    response: Dispatcher.ResponseData,
    parse = true,
): Promise<string | Dispatcher.ResponseData['body']> {
    if (response.statusCode < 400) {
        return parse ? await response.body.text() : response.body;
    }

    if (response.statusCode === 401) {
        throw new AuthenticationError(
            'invalid API key or insufficient permissions',
        );
    }

    const responseTxt = await response.body.text();

    if (response.statusCode === 400) {
        throw new ValidationError(`bad request: ${responseTxt}`);
    }

    throw new APIError(`request failed`, response.statusCode, responseTxt);
}
