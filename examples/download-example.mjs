#!/usr/bin/env node

import 'dotenv/config';
import pkg from '../src/index.js';
const {bdclient} = pkg;

const client = new bdclient();
const result = await client.search('best coffee shops');

await client.download_content(result, 'search_results.json');
await client.download_content(result, 'search_results.csv', 'csv');

console.log('Content saved to files');