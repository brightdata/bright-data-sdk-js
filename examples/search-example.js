#!/usr/bin/env node
'use strict'; /*jslint node:true*/

const {BdClient} = require('../src/index.js');

const client = new BdClient({
    api_token: 'your-api-key',
    auto_create_zones: false,
    serp_zone: 'your-custom-serp-zone'
});

const queries = [
    'iphone 16',
    'coffee maker',
    'portable projector',
    'sony headphones',
    'laptop stand',
    'power bank',
    'running shoes',
    'android tablet',
    'hiking backpack',
    'dash cam'
];

async function main(){
    try {
        console.log('Starting search operations...');
        const results = await client.search(queries, {
            search_engine: 'bing',
            max_workers: 10,
            response_format: 'raw',
            country: 'us'
        });
        console.log(`Successfully completed ${results.length} searches`);
        console.log('Results:', results);
        const file_path = await client.download_content(results,
            'search-results.json', 'json');
        console.log(`Search results saved to: ${file_path}`);
    } catch(e){
        console.error('Search failed:', e.message);
        process.exit(1);
    }
}

if (require.main==module)
    main();