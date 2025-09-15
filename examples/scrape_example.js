require('dotenv').config();
const {bdclient} = require('../src/index.js');

const client = new bdclient(); // Place your API key in the bdclient or .env file

const results = client.scrape('https://example.com');

console.log(results);