require('dotenv').config();
const { bdclient } = require('@brightdata/sdk');

const client = new bdclient(); // Place your API key in the bdclient or .env file

const queries = ['Burger', 'pizza'];

const result = await client.search(queries);
console.log(result);
