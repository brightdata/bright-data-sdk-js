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
} from './constants.js';
import { APIError, AuthenticationError, ValidationError } from './errors.js';

const { dns, retry } = interceptors;

interface GetDispatcherOptions {
    timeout?: number;
}

export const getDispatcher = (params: GetDispatcherOptions = {}) => {
    return new Agent({
        headersTimeout: 10_000,
        bodyTimeout: params.timeout || DEFAULT_TIMEOUT,
    }).compose(
        dns(),
        retry({
            maxRetries: MAX_RETRIES,
            timeoutFactor: RETRY_BACKOFF_FACTOR,
            statusCodes: RETRY_STATUSES,
        }),
    );
};

export const request: typeof lib_request = async (url, opts) =>
    lib_request(url, opts);

export const assertResponse = async (response: Dispatcher.ResponseData) => {
    const responseTxt = await response.body.text();

    if (response.statusCode < 400) return responseTxt;

    if (response.statusCode === 401) {
        throw new AuthenticationError(
            'invalid API key or insufficient permissions',
        );
    }

    if (response.statusCode === 400) {
        throw new ValidationError(`bad request: ${responseTxt}`);
    }

    throw new APIError(`request failed`, response.statusCode, responseTxt);
};
