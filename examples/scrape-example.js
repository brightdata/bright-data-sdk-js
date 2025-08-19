#!/usr/bin/env node
'use strict'; /*jslint node:true*/

const {BdClient} = require('../src/index.js');

const client = new BdClient({
    api_token: 'your-api-token'
});

const urls = [
    'https://www.amazon.com/dp/B079QHML21',
    'https://www.ebay.com/itm/365771796300',
    'https://www.walmart.com/ip/Apple-MacBook-Air-13-3-inch-Laptop-Space-Gray-M1-Chip-8GB-RAM-256GB-storage/609040889'
];

async function main(){
    try {
        console.log('Starting web scraping...');
        const results = await client.scrape(urls, {
            max_workers: 5,
            response_format: 'raw',
            country: 'us',
            data_format: 'markdown'
        });
        console.log(`Successfully scraped ${results.length} URLs`);
        const file_path = await client.download_content(results, null, 'json');
        console.log(`Results saved to: ${file_path}`);
    } catch(e){
        console.error('Scraping failed:', e.message);
        process.exit(1);
    }
}

if (require.main==module)
    main();