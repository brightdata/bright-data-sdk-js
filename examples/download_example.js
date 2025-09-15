require('dotenv').config();
const {bdclient} = require('../src/index.js');

const client = new bdclient(); // Place your API key in the bdclient or .env file

const urls = ['https://example.com', 'https://httpbin.org'];
const result = client.scrape(urls);

client.download_content(result, 'search_results.txt', 'txt');
