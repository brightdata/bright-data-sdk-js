import { getLogger } from './logging-config';
import { NetworkError, APIError } from '../exceptions/errors';

const logger = getLogger('utils.retry');

export function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retryRequest(
    request_fn: () => Promise<unknown>,
    max_retries = 3,
    backoff_factor = 1.5,
    should_retry?: boolean,
) {
    const default_should_retry = (error: any) => {
        if (
            error.code == 'ECONNRESET' ||
            error.code == 'ENOTFOUND' ||
            error.code == 'ECONNREFUSED'
        ) {
            return true;
        }
        const status = error.response?.status;
        return status && [429, 500, 502, 503, 504].includes(status);
    };
    let last_error;
    for (let attempt = 0; attempt <= max_retries; attempt++) {
        try {
            logger.debug(`Request attempt ${attempt + 1}/${max_retries + 1}`);
            const response = await request_fn();
            if (attempt > 0)
                logger.info(
                    `Request succeeded after ${attempt} retry attempts`,
                );
            return response;
        } catch (e: any) {
            last_error = e;
            const status = e.response?.status;
            const error_message = e.message;
            logger.warning(`Request attempt ${attempt + 1} failed`, {
                error: error_message,
                status,
                attempt: attempt + 1,
                max_retries: max_retries + 1,
            });
            if (attempt == max_retries) break;
            if (!should_retry && !default_should_retry?.(e)) {
                logger.info('Error is not retryable, stopping retry attempts', {
                    error: error_message,
                    status,
                });
                break;
            }
            const base_delay = 1000;
            const delay = base_delay * Math.pow(backoff_factor, attempt);
            const jitter = Math.random() * 0.1 * delay;
            const total_delay = Math.floor(delay + jitter);
            logger.debug(`Retrying in ${total_delay}ms...`, {
                attempt: attempt + 1,
                delay: total_delay,
                backoff_factor,
            });
            await sleep(total_delay);
        }
    }
    const final_error = last_error;

    if (final_error.response) {
        const status = final_error.response.status;
        const response_text = final_error.response.data;
        logger.error(`All ${max_retries + 1} request attempts failed`, {
            final_error: final_error.message,
            status,
            response_text:
                typeof response_text == 'string'
                    ? response_text.substring(0, 200)
                    : response_text,
        });
        throw new APIError(
            `Request failed after ${max_retries + 1} attempts: ` +
                `${final_error.message}`,
            status,
            response_text,
        );
    }
    logger.error(
        `All ${max_retries + 1} request attempts failed with network ` +
            'error',
        {
            final_error: final_error.message,
            code: final_error.code,
        },
    );
    throw new NetworkError(
        `Network request failed after ${max_retries + 1} ` +
            `attempts: ${final_error.message}`,
    );
}
