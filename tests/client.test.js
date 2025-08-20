'use strict'; /*jslint node:true*/

const {bdclient, ValidationError} = require('../src/index.js');

jest.mock('axios', ()=>({
    create: jest.fn(()=>({
        request: jest.fn().mockResolvedValue({data: 'mock response'}),
        get: jest.fn().mockResolvedValue({data: []}),
        post: jest.fn().mockResolvedValue({data: {name: 'test'}})
    }))
}));

describe('bdclient - Simple Usage', ()=>{
    test('4-line scraping example should work', async ()=>{
        const client = new bdclient({api_token: 'test_token_123456'});
        const result = await client.scrape('https://example.com');
        expect(result).toBe('mock response');
    });
    
    test('4-line search example should work', async ()=>{
        const client = new bdclient({api_token: 'test_token_123456'});
        const result = await client.search('test query');
        expect(result).toBe('mock response');
    });
    
    test('should reject invalid API token', ()=>{
        expect(()=>new bdclient({api_token: 'short'}))
            .toThrow(ValidationError);
    });
    
    test('should reject invalid URL', async ()=>{
        const client = new bdclient({api_token: 'test_token_123456'});
        await expect(client.scrape('invalid-url'))
            .rejects.toThrow(ValidationError);
    });
});