require('dotenv').config();
const { bdclient } = require('@brightdata/sdk');

const client = new bdclient(); // Place your API key in the bdclient or .env file

const results = await client.scrape('https://example.com');

console.log(results);
