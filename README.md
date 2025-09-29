<img width="1300" height="200" alt="sdk-banner(1)" src="https://github.com/user-attachments/assets/c4a7857e-10dd-420b-947a-ed2ea5825cb8" />

<h3>Bright Data JavaScript SDK providing easy and scalable methods for scraping, web search, and more.</h3>

## Installation
To install the package, open your terminal:

```bash
npm install @brightdata/sdk
```

## Quick start
### 1. [Signup](https://brightdata.com/cp) and get your API key

### 2. Initialize the Client

Create a file named pizzaSearch.mjs with the follwing content:
```javascript
import { bdclient } from '@brightdata/sdk';

const client = new bdclient({
    apiKey: '[your_api_key_here]' // can also be defined as BRIGHTDATA_API_KEY env variable
});
```

### 3. Launch your first request

Add our search function:
```javascript
import { bdclient } from '@brightdata/sdk';

const client = new bdclient({
    apiKey: '[your_api_key_here]' // can also be defined as BRIGHTDATA_API_KEY env variable
});
const result = await client.search('pizza restaurants');
console.log(result);
```

And run:

```bash
node pizzaSearch.mjs
```

## Features

- **Web Scraping**: Scraping every website using unti bot-detection capabilities and proxy support
- **Search Engine Results**: Support Searches on Google, Bing, and Yandex by query (includinig batch searches)
- **Parallel Processing**: Concurrent processing for multiple URLs or queries
- **Robust Error Handling**: Comprehensive error handling with retry logic
- **Zone Management**: Automatic zone creation and management
- **Multiple Output Formats**: HTML, JSON, and Markdown
- **Dual build**: Both ESM and CommonJS supported
- **TypeScript**: Fully typed for different combinations of input and output data

## Usage 

### Scrape websites

```javascript
// single URL - returns markdown string by default
const result = await client.scrape('https://example.com');
console.log(result); // output: web page html content

// multiple URLs (parallel processing)
const urls = [
    'https://example1.com',
    'https://example2.com',
    'https://example3.com',
];
const results = await client.scrape(urls);
console.log(results); // returns array of html strings

// different data formats available
const htmlResult = await client.scrape('https://example.com', {
    dataFormat: 'html', // returns raw HTML (default: 'html')
});

const screenshotResult = await client.scrape('https://example.com', {
    dataFormat: 'screenshot', // returns base64 screenshot image
});

// different response formats
const jsonResult = await client.scrape('https://example.com', {
    format: 'json', // returns parsed JSON object (default: 'raw' string)
});

// combined custom options
const result = await client.scrape('https://example.com', {
    format: 'raw', // 'raw' (default) or 'json'
    dataFormat: 'markdown', // 'markdown' (default), 'raw', 'screenshot', etc.
    country: 'gb', // two-letter country code
    method: 'GET', // HTTP method (default: 'GET')
});
```

### Search Engine Results

```javascript
// single search query
const result = await client.search('pizza restaurants');
console.log(result);

// multiple queries (parallel processing)
const queries = ['pizza', 'restaurants', 'delivery'];
const results = await client.search(queries);
console.log(results);

// different search engines
const result = await client.search('pizza', {
    searchEngine: 'google', // can also be 'yandex' or 'bing'
});
console.log(result);

// custom options
const results = await client.search(['pizza', 'sushi'], {
    country: 'gb',
    format: 'raw',
});
console.log(results);
```

### Saving Results

```javascript
// download scraped content
const data = await client.scrape('https://example.com');
const filePath = await client.saveResults(data, {
    filename: 'results.json',
    format: 'json',
});
console.log(`Content saved to: ${filePath}`);
```

## Configuration

### API Key

- you can get your API key from [here](https://brightdata.com/cp/setting/users?=)

### Environment Variables

Set the following env variables (also configurable in client constructor)

```env
BRIGHTDATA_API_KEY=your_bright_data_api_key
BRIGHTDATA_WEB_UNLOCKER_ZONE=your_web_unlocker_zone  # Optional, if you have a spesific zone
BRIGHTDATA_SERP_ZONE=your_serp_zone                  # Optional, if you have a spesific zone
```

### Manage Zones

```javascript
const zones = await client.listZones();
console.log(`Found ${zones.length} zones`);
```

### Constants

| Constant               | Default | Description                    |
| ---------------------- | ------- | ------------------------------ |
| `DEFAULT_CONCURRENCY`  | `10`    | Max parallel tasks             |
| `DEFAULT_TIMEOUT`      | `30000` | Request timeout (milliseconds) |
| `MAX_RETRIES`          | `3`     | Retry attempts on failure      |
| `RETRY_BACKOFF_FACTOR` | `1.5`   | Exponential backoff multiplier |

## API Reference

### bdclient Class

```javascript
const client = new bdclient({
    apiKey: 'string', // Your API key
    autoCreateZones: true, // Auto-create zones if they don't exist
    webUnlockerZone: 'string', // Custom web unlocker zone name
    serpZone: 'string', // Custom SERP zone name
    logLevel: 'INFO', // Log level
    structuredLogging: true, // Use structured JSON logging
    verbose: false, // Enable verbose logging
});
```

### Key Methods

### scrape(url, options)
Scrapes a single URL or array of URLs using the Web Unlocker.

**Parameters:**

| Name                   | Type                                   | Description                                                     | Default   |
|------------------------|----------------------------------------|-----------------------------------------------------------------|-----------|
| `url`                  | `string` &#124; `string[]`            | Single URL string or array of URLs                              | —         |
| `options.zone`         | `string`                               | Zone identifier (auto-configured if `null`)                     | —         |
| `options.format`       | `"json"` &#124; `"raw"`                | Response format                                                 | `"raw"`   |
| `options.method`       | `string`                               | HTTP method                                                     | `"GET"`   |
| `options.country`      | `string`                               | Two-letter country code                                         | `""`      |
| `options.dataFormat`   | `"markdown"` &#124; `"screenshot"` &#124; `"html"` | Returned content format                                         | `"html"`  |
| `options.concurrency`  | `number`                               | Max parallel workers                                            | `10`      |
| `options.timeout`      | `number` (ms)                          | Request timeout                                                 | `30000`   |

### search(query, options)

Searches using the SERP API

**Parameters:**

| Name                     | Type                                             | Description                                   | Default     |
|--------------------------|--------------------------------------------------|-----------------------------------------------|-------------|
| `query`                  | `string` &#124; `string[]`                       | Search query string or array of queries       | —           |
| `options.searchEngine`   | `"google"` &#124; `"bing"` &#124; `"yandex"`     | Search engine                                 | `"google"`  |
| `options.zone`           | `string`                                         | Zone identifier (auto-configured if `null`)   | —           |
| `options.format`         | `"json"` &#124; `"raw"`                          | Response format                               | `"raw"`     |
| `options.method`         | `string`                                         | HTTP method                                   | `"GET"`     |
| `options.country`        | `string`                                         | Two-letter country code                       | `""`        |
| `options.dataFormat`     | `"markdown"` &#124; `"screenshot"` &#124; `"html"`| Returned content format                       | `"html"`    |
| `options.concurrency`    | `number`                                         | Max parallel workers                          | `10`        |
| `options.timeout`        | `number` (ms)                                    | Request timeout                               | `30000`     |

### saveResults(content, options)

Save content to local file.

**Parameters:**

| Name               | Type                                        | Description                                     | Default |
|--------------------|---------------------------------------------|-------------------------------------------------|---------|
| `content`          | `any`                                       | Content to save                                 | —       |
| `options.filename` | `string`                                    | Output filename (auto-generated if `null`)      | —       |
| `options.format`   | `string` (`"json"`, `"csv"`, `"txt"`)    | File format                                     | `"json"`|

### listZones()

List all active zones in your Bright Data account.

**Returns:** Promise<Array<ZoneInfo>>

## Error Handling

The SDK includes built-in input validation and retry logic:

```javascript
try {
    const result = await client.scrape('https://example.com');
    console.log(result);
} catch (error) {
    if (error.name === 'ValidationError') {
        console.error('Invalid input:', error.message);
    } else {
        console.error('API error:', error.message);
    }
}
```
## Development

For development installation:

```bash
git clone https://github.com/brightdata/bright-data-sdk-js.git
cd bright-data-sdk-js
npm install
npm run build:dev
```

## Support

For any issues, contact [Bright Data support](https://brightdata.com/contact), or open an issue in this repository.

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).
