import { getLogger } from './logging-config';

export function safeJsonParse(data: unknown) {
    if (typeof data != 'string') return data;

    try {
        return JSON.parse(data);
    } catch (e: any) {
        const logger = getLogger('utils.json');
        logger.warning(
            'Failed to parse JSON response, returning as ' + 'string',
            {
                error: e.message,
                data: data.substring(0, 200) + (data.length > 200 ? '...' : ''),
            },
        );
        return data;
    }
}

export const isTrueLike = (val: unknown) =>
    ['true', '1', 'yes', 'on'].includes(String(val).toLowerCase());
