require('dotenv').config();
const {bdclient} = require('../src/index.js');

const client = new bdclient();
const result = client.search('pizza restaurants');
console.log(result);