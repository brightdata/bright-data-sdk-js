'use strict'; /*jslint node:true*/

const {BdClient, ValidationError, AuthenticationError} = 
    require('../src/index.js');

jest.mock('axios', ()=>({
    create: jest.fn(()=>({
        request: jest.fn(),
        get: jest.fn(),
        post: jest.fn()
    }))
}));

describe('BdClient', ()=>{
    describe('Constructor', ()=>{
        test('should initialize with valid API token', ()=>{
            const client = new BdClient({
                api_token: 'test_api_token_123456'
            });
            expect(client.api_token).toBe('test_api_token_123456');
            expect(client.web_unlocker_zone).toBe('sdk_unlocker');
            expect(client.serp_zone).toBe('sdk_serp');
        });
        test('should throw ValidationError when API token is missing', ()=>{
            expect(()=>{
                new BdClient({});
            }).toThrow(ValidationError);
        });
        test('should throw ValidationError when API token is too short', ()=>{
            expect(()=>{
                new BdClient({
                    api_token: 'short'
                });
            }).toThrow(ValidationError);
        });
        test('should use environment variables for configuration', ()=>{
            process.env.BRIGHTDATA_API_TOKEN = 'env_api_token_123456';
            process.env.WEB_UNLOCKER_ZONE = 'custom_web_zone';
            process.env.SERP_ZONE = 'custom_serp_zone';
            const client = new BdClient();
            expect(client.api_token).toBe('env_api_token_123456');
            expect(client.web_unlocker_zone).toBe('custom_web_zone');
            expect(client.serp_zone).toBe('custom_serp_zone');
            delete process.env.BRIGHTDATA_API_TOKEN;
            delete process.env.WEB_UNLOCKER_ZONE;
            delete process.env.SERP_ZONE;
        });
        test('should use custom zone names when provided', ()=>{
            const client = new BdClient({
                api_token: 'test_api_token_123456',
                web_unlocker_zone: 'my_web_zone',
                serp_zone: 'my_serp_zone'
            });
            expect(client.web_unlocker_zone).toBe('my_web_zone');
            expect(client.serp_zone).toBe('my_serp_zone');
        });
    });
    describe('Input Validation', ()=>{
        let client;
        beforeEach(()=>{
            client = new BdClient({
                api_token: 'test_api_token_123456'
            });
        });
        test('scrape should validate URL format', async ()=>{
            await expect(client.scrape('invalid-url')).rejects
                .toThrow(ValidationError);
            await expect(client.scrape('')).rejects.toThrow(ValidationError);
            await expect(client.scrape(123)).rejects.toThrow(ValidationError);
        });
        test('scrape should validate URL array', async ()=>{
            await expect(client.scrape([])).rejects.toThrow(ValidationError);
            await expect(client.scrape(['invalid-url'])).rejects
                .toThrow(ValidationError);
        });
        test('search should validate query format', async ()=>{
            await expect(client.search('')).rejects.toThrow(ValidationError);
            await expect(client.search([])).rejects.toThrow(ValidationError);
            await expect(client.search([''])).rejects.toThrow(ValidationError);
        });
        test('search should validate search engine', async ()=>{
            await expect(client.search('test query', {
                search_engine: 'invalid_engine'
            })).rejects.toThrow(ValidationError);
        });
    });
    describe('Configuration', ()=>{
        test('should set default values correctly', ()=>{
            const client = new BdClient({
                api_token: 'test_api_token_123456'
            });
            expect(client.DEFAULT_MAX_WORKERS).toBe(10);
            expect(client.DEFAULT_TIMEOUT).toBe(30*1000);
            expect(client.MAX_RETRIES).toBe(3);
            expect(client.RETRY_BACKOFF_FACTOR).toBe(1.5);
        });
        test('should configure logging options', ()=>{
            const client = new BdClient({
                api_token: 'test_api_token_123456',
                log_level: 'DEBUG',
                structured_logging: false,
                verbose: true
            });
            expect(client).toBeDefined();
        });
    });
    describe('Zone Management', ()=>{
        test('should have zone manager instance', ()=>{
            const client = new BdClient({
                api_token: 'test_api_token_123456'
            });
            expect(client.zone_manager).toBeDefined();
        });
        test('should have web scraper instance', ()=>{
            const client = new BdClient({
                api_token: 'test_api_token_123456'
            });
            expect(client.web_scraper).toBeDefined();
        });
        test('should have search API instance', ()=>{
            const client = new BdClient({
                api_token: 'test_api_token_123456'
            });
            expect(client.search_api).toBeDefined();
        });
    });
});