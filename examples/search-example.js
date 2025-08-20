#!/usr/bin/env node
'use strict'; /*jslint node:true*/

const {bdclient} = require('../src/index.js');

(async ()=>{
    const client = new bdclient({api_token: 'your-api-token'});
    const result = await client.search('pizza restaurants', );
    console.log(result);
})();