# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-08-19

### Added

- Initial release of Bright Data JavaScript/Node.js SDK
- Web scraping functionality using Bright Data Web Unlocker API
- Search engine results using Bright Data SERP API
- Support for multiple search engines (Google, Bing, Yandex)
- Parallel processing for multiple URLs and queries
- Comprehensive error handling with retry logic
- Input validation for URLs, zones, and parameters
- Automatic zone creation and management
- Multiple output formats (JSON, raw HTML, markdown)
- Content download functionality
- Zone management utilities
- Comprehensive logging system
- Built-in connection pooling
- Environment variable configuration support

### Features

- `BdClient` main client class
- `scrape()` method for web scraping
- `search()` method for SERP API
- `downloadContent()` for saving results
- `listZones()` for zone management
- Automatic retry with exponential backoff
- Structured logging support
- Configuration via environment variables or direct parameters
- TypeScript definitions included
- ESLint and Jest configuration

### Dependencies

- `axios>=1.6.0`
- `dotenv>=16.0.0`

### Node.js Support

- Node.js 12.0+
- Cross-platform compatibility (Windows, macOS, Linux)
