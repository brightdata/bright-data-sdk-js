import {
    type Dispatcher,
    Agent,
    interceptors,
    request as lib_request,
    stream as lib_stream,
} from 'undici';
import type { UrlObject } from 'node:url';
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

const log = (
    method = 'GET',
    url: string | URL | UrlObject,
    query?: Record<string, unknown>,
    body?: unknown,
) => {
    let meta = '';

    if (query) {
        meta += ` query=${JSON.stringify(query)}`;
    }

    if (typeof body === 'string') {
        if (meta) meta += ' ';
        meta += `body=${body}`;
    }

    logRequest(method, JSON.stringify(url), meta);
};

export const request: typeof lib_request = async (url, opts) => {
    log(opts?.method, url, opts?.query, opts?.body);
    return lib_request(url, opts);
};

export const stream: typeof lib_stream = async (url, opts, factory) => {
    log(opts?.method, url, opts?.query, opts?.body);
    return lib_stream(url, opts, factory);
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
