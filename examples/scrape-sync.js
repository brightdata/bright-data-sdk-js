require('dotenv').config();
const {bdclient} = require('../src/index.js');

const client = new bdclient();
const result = client.scrape('https://example.com');
console.log(result);