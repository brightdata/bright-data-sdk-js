require('dotenv').config();
const { bdclient } = require('../src/index.js');

const client = new bdclient(); // Place your API key in the bdclient or .env file

const urls = ['https://example.com', 'https://httpbin.org'];
const result = await client.scrape(urls);

await client.downloadContent(result, 'search_results.txt', 'txt');
