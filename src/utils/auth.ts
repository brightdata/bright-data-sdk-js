import { USER_AGENT } from './constants';

export const getAuthHeaders = (apiKey: string) => ({
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'User-Agent': USER_AGENT,
});
