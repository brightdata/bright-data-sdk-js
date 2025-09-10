require('dotenv').config();
const {bdclient} = require('../src/index.js');

const client = new bdclient();
const result = client.search('best coffee shops');

client.download_content(result, 'search_results.json');
client.download_content(result, 'search_results.csv', 'csv');

console.log('Content saved to files');