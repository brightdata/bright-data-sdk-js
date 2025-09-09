#!/usr/bin/env node
'use strict'; /*jslint node:true*/

require('dotenv').config();
const {bdclient} = require('../src/index.js');

(async () => {
    const client = new bdclient();
    const result = await client.search('pizza restaurants');
    console.log(result);
})();