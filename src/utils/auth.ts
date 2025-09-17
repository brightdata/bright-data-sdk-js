import { USER_AGENT } from './constants';

export const getAuthHeaders = (api_token: string) => ({
    Authorization: `Bearer ${api_token}`,
    'Content-Type': 'application/json',
    'User-Agent': USER_AGENT,
});
