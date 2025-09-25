require('dotenv').config();
const { bdclient } = require('@brightdata/sdk');

// put your API key in the apiKey option or BRIGHTDATA_API_KEY env variable
const client = new bdclient();
const results = await client.scrape('https://example.com');

console.log(results);
