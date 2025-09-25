# Bright Data SDK for JavaScript/Node.js

<img width="1300" height="200" alt="sdk-banner(1)" src="https://github.com/user-attachments/assets/c4a7857e-10dd-420b-947a-ed2ea5825cb8" />

<h3 align="center">A JavaScript SDK for Bright Data's web unlocking tools, providing easy-to-use scalable methods for scraping, web search, and more.</h3>

For a quick start, you can try running our example files in this repository.

## Features

- **Web Scraping**: Scrape websites using Bright Data Web Unlocker API with proxy support
- **Search Engine Results**: Perform web searches using Bright Data SERP API
- **Multiple Search Engines**: Support for Google, Bing, and Yandex
- **Parallel Processing**: Concurrent processing for multiple URLs or queries
- **Robust Error Handling**: Comprehensive error handling with retry logic
- **Zone Management**: Automatic zone creation and management
- **Multiple Output Formats**: HTML, JSON, and Markdown

## Installation

Install the package via NPM:

```bash
npm install @brightdata/sdk
```

## Quick start

### Get your API key

1. Sign up at [Bright Data Website](https://brightdata.com), and navigate to your dashboard
1. [Create your API key](https://docs.brightdata.com/api-reference/authentication#how-do-i-generate-a-new-api-key%3F)
1. Copy your API key

### Launch your first request

Copy the following code to run a simple SERP scraper:

```javascript
const { bdclient } = require('@brightdata/sdk');

const apiKey = '[your_api_key_here]'; // can also be defined as BRIGHTDATA_API_KEY env variable
const client = new bdclient({ apiKey });
const result = await client.search('pizza restaurants');
console.log(result);
```

## Usage

### 1. Initialize the client

```javascript
const { bdclient } = require('@brightdata/sdk');

const apiKey = '[your_api_key_here]'; // can also be defined as BRIGHTDATA_API_KEY env variable
const client = new bdclient({ apiKey });
```

Or you can use a custom zone name:

```javascript
const client = new bdclient({
    apiKey: '[your_api_key_here]',
    autoCreateZones: false, // Otherwise it creates zones automatically
    webUnlockerZone: 'custom_zone', // Custom zone name for web scraping
    serpZone: 'custom_serp_zone', // Custom zone name for search requests
});
```

### 2. Scrape websites

```javascript
// Single URL - Returns markdown string by default
const result = await client.scrape('https://example.com');
console.log(result); // Output: web page html content

// Multiple URLs (parallel processing)
const urls = [
    'https://example1.com',
    'https://example2.com',
    'https://example3.com',
];
const results = await client.scrape(urls);
console.log(results); // Returns array of html strings

// Different data formats available
const htmlResult = await client.scrape('https://example.com', {
    dataFormat: 'html', // Returns raw HTML (default: 'html')
});

const screenshotResult = await client.scrape('https://example.com', {
    dataFormat: 'screenshot', // Returns base64 screenshot image
});

// Different response formats
const jsonResult = await client.scrape('https://example.com', {
    format: 'json', // Returns parsed JSON object (default: 'raw' string)
});

// Combined custom options
const result = await client.scrape('https://example.com', {
    format: 'raw', // 'raw' (default) or 'json'
    dataFormat: 'markdown', // 'markdown' (default), 'raw', 'screenshot', etc.
    country: 'gb', // Two-letter country code
    method: 'GET', // HTTP method (default: 'GET')
});
```

### 3. Search Engine Results

```javascript
// Single search query
const result = await client.search('pizza restaurants');
console.log(result);

// Multiple queries (parallel processing)
const queries = ['pizza', 'restaurants', 'delivery'];
const results = await client.search(queries);
console.log(results);

// Different search engines
const result = await client.search('pizza', {
    searchEngine: 'google', // can also be 'yandex' or 'bing'
});
console.log(result);

// Custom options
const results = await client.search(['pizza', 'sushi'], {
    country: 'gb',
    format: 'raw',
});
console.log(results);
```

### 4. Saving Results

```javascript
// Download scraped content
const data = await client.scrape('https://example.com');
const filePath = await client.saveResults(data, {
    filename: 'results.json',
    format: 'json',
});
console.log(`Content saved to: ${filePath}`);
```

## Configuration

### Environment Variables

Set the following env variables (also configurable in client constructor)

```env
BRIGHTDATA_API_KEY=your_bright_data_api_key          # Optional
BRIGHTDATA_WEB_UNLOCKER_ZONE=your_web_unlocker_zone  # Optional
BRIGHTDATA_SERP_ZONE=your_serp_zone                  # Optional
```

### Manage Zones

```javascript
const zones = await client.listZones();
console.log(`Found ${zones.length} zones`);
```

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

#### scrape(url, options)

Scrapes a single URL or array of URLs using the Web Unlocker.

**Parameters:**

- `url` (string | Array<string>): Single URL string or array of URLs
- `options` (Object, optional):
    - `zone` (string): Zone identifier (auto-configured if null)
    - `format` (string): "json" or "raw" (default: "raw")
    - `method` (string): HTTP method (default: "GET")
    - `country` (string): Two-letter country code (default: "")
    - `dataFormat` (string): "markdown", "screenshot", "html". (default: "html")
    - `concurrency` (number): Max parallel workers (default: 10)
    - `timeout` (number): Request timeout in milliseconds (default: 30000)

#### search(query, options)

Searches using the SERP API

**Parameters:**

- `query` (string | Array<string>): Search query string or array of queries
- `options` (Object, optional):
    - `searchEngine` (string): "google", "bing", or "yandex" (default: "google")
    - `zone` (string): Zone identifier (auto-configured if null)
    - `format` (string): "json" or "raw" (default: "raw")
    - `method` (string): HTTP method (default: "GET")
    - `country` (string): Two-letter country code (default: "")
    - `dataFormat` (string): "markdown", "screenshot", "html". (default: "html")
    - `concurrency` (number): Max parallel workers (default: 10)
    - `timeout` (number): Request timeout in milliseconds (default: 30000)

#### saveResults(content, options)

Save content to local file.

**Parameters:**

- `content` (any): Content to save
- `options` (Object, optional):
    - `filename` (string): Output filename (auto-generated if null)
    - `format` (string): File format ("json", "csv", "txt", etc.) (default: "json")

#### listZones()

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

## Production Features

- **Retry Logic**: Automatic retries with exponential backoff for network failures
- **Input Validation**: Validates URLs, zone names, and parameters
- **Connection Pooling**: Efficient HTTP connection management
- **Logging**: Comprehensive logging for debugging and monitoring
- **Zone Auto-Creation**: Automatically creates required zones if they don't exist

## Configuration Constants

| Constant               | Default | Description                    |
| ---------------------- | ------- | ------------------------------ |
| `DEFAULT_CONCURRENCY`  | `10`    | Max parallel tasks             |
| `DEFAULT_TIMEOUT`      | `30000` | Request timeout (milliseconds) |
| `MAX_RETRIES`          | `3`     | Retry attempts on failure      |
| `RETRY_BACKOFF_FACTOR` | `1.5`   | Exponential backoff multiplier |

## TypeScript Support

The SDK includes TypeScript definitions. Import with TypeScript:

```typescript
import { bdclient } from '@brightdata/sdk';

const client = new bdclient({
    apiKey: '[your_api_key_here]',
});
```

## Development

For development installation:

```bash
git clone https://github.com/brightdata/bright-data-sdk-js.git
cd bright-data-sdk-js
npm install
npm run dev
```

## Support

For any issues, contact [Bright Data support](https://brightdata.com/contact), or open an issue in this repository.

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).
