#!/usr/bin/env node
'use strict'; /*jslint node:true*/

require('dotenv').config();
const {bdclient} = require('../src/index.js');

(async () => {
    const client = new bdclient();
    const result = await client.scrape('https://example.com');
    console.log(result);
})();