#!/usr/bin/env node
'use strict'; /*jslint node:true*/

require('dotenv').config();
const {bdclient} = require('../src/index.js');

(async () => {
    const client = new bdclient();
    const result = await client.search('best coffee shops');
    
    await client.download_content(result, 'search_results.json');
    await client.download_content(result, 'search_results.csv', 'csv');
    
    console.log('Content saved to files');
})();