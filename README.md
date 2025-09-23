# Bright Data SDK for JavaScript/Node.js

<img width="1300" height="200" alt="sdk-banner(1)" src="https://github.com/user-attachments/assets/c4a7857e-10dd-420b-947a-ed2ea5825cb8" />

<h3 align="center">A JavaScript SDK for Bright Data's web unlocking tools, providing easy-to-use scalable methods for scraping, web search, and more.</h3>

For a quick start, you can try running our example files in this repository.

## Features

- **Web Scraping**: Scrape websites using Bright Data Web Unlocker API with proxy support
- **Search Engine Results**: Perform web searches using Bright Data SERP API
- **Multiple Search Engines**: Support for Google, Bing, and Yandex
- **Parallel Processing**: Concurrent processing for multiple URLs or queries with synchronous API
- **Robust Error Handling**: Comprehensive error handling with retry logic
- **Zone Management**: Automatic zone creation and management
- **Multiple Output Formats**: JSON, raw HTML, markdown, and more

## Installation

Install the package from GitHub:

```bash
npm install brightdata/bright-data-sdk-js
```

Or using yarn:

```bash
yarn add brightdata/bright-data-sdk-js
```

## Launch your first request

Make sure you have a [Bright Data](https://brightdata.com/cp/setting/) account with an API key, and SDK package downloaded.

In your IDE, paste the following code for a simple scraper:

```javascript
const { bdclient } = require('brightdata');

const client = new bdclient({
    apiKey: 'your_api_key_here', // can also be defined as BRIGHTDATA_API_KEY in your .env file
});

const result = client.search('pizza restaurants');
console.log(result);
```

## Using functions

### 1. Initialize the Client

```javascript
const { bdclient } = require('brightdata');

const client = new bdclient({
    apiKey: 'your_api_key_here', // can also be defined as BRIGHTDATA_API_KEY in your .env file
});
```

Or you can use a custom zone name:

```javascript
const client = new bdclient({
    apiKey: 'your_api_key_here',
    auto_create_zones: false, // Otherwise it creates zones automatically
    web_unlocker_zone: 'custom_zone', // Custom zone name for web scraping
    serp_zone: 'custom_serp_zone', // Custom zone name for search requests
});
```

### 2. Scrape Websites

```javascript
// Single URL - Returns markdown string by default
const result = client.scrape('https://example.com');
console.log(result); // Output: markdown formatted web page content

// Multiple URLs (parallel processing)
const urls = [
    'https://example1.com',
    'https://example2.com',
    'https://example3.com',
];
const results = client.scrape(urls);
console.log(results); // Returns array of markdown strings

// Different data formats available
const htmlResult = client.scrape('https://example.com', {
    data_format: 'html', // Returns raw HTML (default: 'html')
});

const screenshotResult = client.scrape('https://example.com', {
    data_format: 'screenshot', // Returns base64 screenshot image
});

// Different response formats
const jsonResult = client.scrape('https://example.com', {
    response_format: 'json', // Returns parsed JSON object (default: 'raw' string)
});

// Combined custom options
const result = client.scrape('https://example.com', {
    response_format: 'raw', // 'raw' (default) or 'json'
    data_format: 'markdown', // 'markdown' (default), 'raw', 'screenshot', etc.
    country: 'gb', // Two-letter country code
    method: 'GET', // HTTP method (default: 'GET')
});
```

### 3. Search Engine Results

```javascript
// Single search query
const result = client.search('pizza restaurants');
console.log(result);

// Multiple queries (parallel processing)
const queries = ['pizza', 'restaurants', 'delivery'];
const results = client.search(queries);
console.log(results);

// Different search engines
const result = client.search('pizza', {
    search_engine: 'google', // can also be 'yandex' or 'bing'
});
console.log(result);

// Custom options
const results = client.search(['pizza', 'sushi'], {
    country: 'gb',
    response_format: 'raw',
});
console.log(results);
```

### 4. Download Content

```javascript
// Download scraped content
const data = client.scrape('https://example.com');
const filePath = client.download_content(data, 'results.json', 'json');
console.log(`Content saved to: ${filePath}`);
```

## Configuration

### Environment Variables

Create a `.env` file in your project root:

```env
BRIGHTDATA_API_KEY=your_bright_data_api_key
BRIGHTDATA_WEB_UNLOCKER_ZONE=your_web_unlocker_zone  # Optional
BRIGHTDATA_SERP_ZONE=your_serp_zone                  # Optional
```

### Manage Zones

```javascript
// List all active zones (not available in sync version)
const zones = client.list_zones();
console.log(`Found ${zones.length} zones`);
```

## API Reference

### bdclient Class

```javascript
const client = new bdclient({
    apiKey: 'string', // Your API key
    auto_create_zones: true, // Auto-create zones if they don't exist
    web_unlocker_zone: 'string', // Custom web unlocker zone name
    serp_zone: 'string', // Custom SERP zone name
    log_level: 'INFO', // Log level
    structured_logging: true, // Use structured JSON logging
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
    - `response_format` (string): "json" or "raw" (default: "raw")
    - `method` (string): HTTP method (default: "GET")
    - `country` (string): Two-letter country code (default: "")
    - `data_format` (string): "markdown", "screenshot", etc. (default: "markdown")
    - `async_request` (boolean): Enable async processing (default: false)
    - `max_workers` (number): Max parallel workers (default: 10)
    - `timeout` (number): Request timeout in milliseconds (default: 30000)

#### search(query, options)

Searches using the SERP API. Accepts the same arguments as scrape(), plus:

**Parameters:**

- `query` (string | Array<string>): Search query string or array of queries
- `options` (Object, optional):
    - `search_engine` (string): "google", "bing", or "yandex" (default: "google")
    - Other parameters same as scrape()

#### download_content(content, filename, format)

Save content to local file.

**Parameters:**

- `content` (any): Content to save
- `filename` (string, optional): Output filename (auto-generated if null)
- `format` (string): File format ("json", "csv", "txt", etc.) (default: "json")

#### list_zones()

List all active zones in your Bright Data account.

**Returns:** Promise<Array<ZoneInfo>>

## Error Handling

The SDK includes built-in input validation and retry logic:

```javascript
try {
    const result = client.scrape('https://example.com');
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
import { bdclient } from 'brightdata';

const client = new bdclient({
    apiKey: 'your_api_key_here',
});
```

## Getting Your API Key

1. Sign up at [brightdata.com](https://brightdata.com/), and navigate to your dashboard
2. Create or access your API credentials
3. Copy your API key and use it in your code or .env file

## Development

For development installation:

```bash
git clone https://github.com/brightdata/bright-data-sdk-js.git
cd bright-data-sdk-js
npm install
npm test
```

## License

This project is licensed under the MIT License.

## Support

For any issues, contact [Bright Data support](https://brightdata.com/contact), or open an issue in this repository.
