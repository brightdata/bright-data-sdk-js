import { getLogger } from './logging-config';

export function parseJSON<T>(data: string): T {
    try {
        return JSON.parse(data);
    } catch (e: unknown) {
        const logger = getLogger('utils.json');
        logger.warning(
            'Failed to parse JSON response, returning as ' + 'string',
            {
                error: (e as Error).message,
                data: data.substring(0, 200) + (data.length > 200 ? '...' : ''),
            },
        );
        throw new Error('Failed to parse JSON response');
    }
}

export const dropEmptyKeys = (obj: Object) => {
    for (const key in obj) {
        if (obj[key] === undefined || obj[key] === null || obj[key] === '') {
            delete obj[key];
        }
    }
};

export const maskKey = (key: string) =>
    key.length > 8 ? `***${key.slice(-4)}` : '***';
