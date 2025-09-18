import { type Dispatcher, Agent, interceptors } from 'undici';
import {
    DEFAULT_TIMEOUT,
    MAX_RETRIES,
    RETRY_BACKOFF_FACTOR,
    RETRY_STATUSES,
} from './constants';

const { dns, retry } = interceptors;

let agent: Dispatcher;

interface GetDispatcherOptions {
    timeout?: number;
}

export const getDispatcher = (params: GetDispatcherOptions = {}) => {
    if (agent) return agent;

    agent = new Agent({
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

    return agent;
};

export const isResponseOk = (response: Dispatcher.ResponseData): boolean =>
    response.statusCode >= 200 && response.statusCode < 300;
