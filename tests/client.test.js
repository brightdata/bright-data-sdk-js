'use strict'; /*jslint node:true*/

const {bdclient, ValidationError} = require('../src/index.js');

// Mock sync-request instead of axios
jest.mock('sync-request', () => {
    return jest.fn(() => ({
        statusCode: 200,
        getBody: jest.fn(() => JSON.stringify({
            data: 'mocked search result content',
            response_format: 'raw'
        }))
    }));
});

describe('bdclient - Simple Usage', ()=>{
    test('4-line scraping example should work', ()=>{
        const client = new bdclient({api_token: 'test_token_1234567890abcdef', auto_create_zones: false});
        const result = client.scrape('https://example.com');
        expect(result).toBe('{"data":"mocked search result content","response_format":"raw"}');
    });
    
    test('4-line search example should work', ()=>{
        const client = new bdclient({api_token: 'test_token_1234567890abcdef', auto_create_zones: false});
        const result = client.search('test query');
        expect(result).toBe('{"data":"mocked search result content","response_format":"raw"}');
    });
    
    test('should reject invalid API token', ()=>{
        expect(()=>new bdclient({api_token: 'short'}))
            .toThrow(ValidationError);
    });
    
    test('should reject invalid URL', ()=>{
        const client = new bdclient({api_token: 'test_token_1234567890abcdef', auto_create_zones: false});
        expect(()=>client.scrape('invalid-url'))
            .toThrow(ValidationError);
    });
});