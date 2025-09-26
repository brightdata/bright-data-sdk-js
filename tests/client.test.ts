import type { Dispatcher } from 'undici';
import { describe, expect, test, vi } from 'vitest';
import { bdclient, ValidationError } from '../src/index.js';
import * as net from '../src/utils/net.js';

vi.spyOn(net, 'request').mockImplementation(() => {
    return Promise.resolve({
        statusCode: 200,
        body: {
            text: () =>
                Promise.resolve(
                    JSON.stringify({
                        data: 'mocked search result content',
                        response_format: 'raw',
                    }),
                ),
        },
    } as Dispatcher.ResponseData);
});

describe('bdclient - Simple Usage', () => {
    test('4-line scraping example should work', async () => {
        const client = new bdclient({
            apiKey: 'test_token_1234567890abcdef',
            autoCreateZones: false,
        });
        const result = await client.scrape('https://example.com');
        expect(result).toBe(
            '{"data":"mocked search result content","response_format":"raw"}',
        );
    });
    test('4-line search example should work', async () => {
        const client = new bdclient({
            apiKey: 'test_token_1234567890abcdef',
            autoCreateZones: false,
        });
        const result = await client.search('test query');
        expect(result).toBe(
            '{"data":"mocked search result content","response_format":"raw"}',
        );
    });
    test('should reject invalid API token', () => {
        expect(() => new bdclient({ apiKey: 'short' })).toThrow(
            ValidationError,
        );
    });
    test('should reject invalid URL', async () => {
        const client = new bdclient({
            apiKey: 'test_token_1234567890abcdef',
            autoCreateZones: false,
        });
        await expect(() => client.scrape('invalid-url')).rejects.toThrowError(
            ValidationError,
        );
    });
});
