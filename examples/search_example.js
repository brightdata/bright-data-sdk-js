require('dotenv').config();
const {bdclient} = require('../src/index.js');

const client = new bdclient();

const queries = [
    'Burger',
    'pizza'
];

const result = client.search(queries);
console.log(result);