#!/usr/bin/env node
'use strict'; /*jslint node:true*/

const {bdclient} = require('../src/index.js');

async function main(){
    const client = new bdclient({api_token: 'your-api-token'});
    const result = await client.scrape('https://example.com');
    console.log(result);
}

main().catch(console.error);