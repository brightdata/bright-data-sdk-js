require('dotenv').config();
const { bdclient } = require('@brightdata/sdk');

// put your API key in the apiKey option or BRIGHTDATA_API_KEY env variable
const client = new bdclient();
const result = await client.scrape([
    'https://example.com',
    'https://httpbin.org',
]);

await client.downloadContent(result, 'search_results.txt', 'txt');
