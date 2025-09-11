require('dotenv').config();
const {bdclient} = require('../src/index.js');

const client = new bdclient();
const urls = [
    'https://example.com',
    'https://httpbin.org'
];
const result = client.scrape(urls);
console.log(result);