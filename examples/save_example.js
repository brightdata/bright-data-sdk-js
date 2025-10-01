require('dotenv').config();
const { bdclient } = require('@brightdata/sdk');

// put your API key in the apiKey option or BRIGHTDATA_API_KEY env variable
const client = new bdclient();
const result = await client.scrape([
    'https://example.com',
    'https://httpbin.org',
]);

const fullname = await client.saveResults(result, {
    filename: 'search_results.txt',
    format: 'txt',
});

console.log(`Results saved to ${fullname}`);
