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

export const isResponseOk = (response: Dispatcher.ResponseData): boolean =>
    response.statusCode >= 200 && response.statusCode < 300;
