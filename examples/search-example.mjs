#!/usr/bin/env node

import 'dotenv/config';
import pkg from '../src/index.js';
const {bdclient} = pkg;

const client = new bdclient();
const result = await client.search('pizza restaurants');
console.log(result);