# Bright Data SDK Contribution Guide

## DNA Principles to Apply

1. **Performance First**: Never compromise response times. Current benchmarks must be maintained or improved:
   - Single URL scraping: ~600ms
   - Batch processing: ~5.2s for multiple URLs
   - Search operations: ~3.6s for batch queries

2. **Zero Breaking Changes**: Maintain existing API signatures and behavior
   - Keep same method names and parameters
   - Preserve return value formats
   - Ensure backward compatibility

3. **Parallel by Design**: Leverage parallel processing for batch operations
   - Use `Promise.all()` for concurrent requests
   - Implement proper timeout handling with `AbortController`
   - Avoid blocking operations in async flows

## Speed Preservation Requirements

### Critical Performance Rules
- **Never** replace sync-request for single URL operations (tested: causes 66% slowdown)
- **Always** use native fetch + deasync pattern for batch operations
- **Maintain** timeout controls without adding unnecessary delays
- **Test** performance before/after each change using example files

### Performance Testing
```bash
# Run these commands to verify performance with timing:
time node examples/scrape_example.js
time node examples/search_example.js
```

Expected benchmarks:
- Scrape example: ~5.2s total execution time
- Search example: ~3.6s total execution time

## Code Quality Standards

### Input Validation
- Validate all user inputs at method entry points
- Use dedicated validation functions from utils/
- Throw appropriate custom errors (ValidationError, APIError, AuthenticationError)

### Error Handling
- Catch and re-throw custom exceptions
- Log errors with appropriate context
- Return error objects in batch operations instead of throwing

### Security
- Never log sensitive data (API tokens, personal info)
- Sanitize file paths and names
- Validate URLs and prevent injection attacks

## Essential Coding Conventions

### Spacing and Formatting
```javascript
// Correct spacing around operators
if (response.statusCode>=400)
const result = a+b*c;

// Proper brace placement
if (condition)
{
    // body
}

// Arrow function formatting
const fn = ()=>{
    return value;
};
```

### Request Structure
```javascript
const request_data = {
    url,
    zone,
    format:response_format,
    method:method.toUpperCase(),
    data_format
};
```

### Timeout Implementation
```javascript
const controller = new AbortController();
const timeoutId = setTimeout(()=>controller.abort(), timeout || this.default_timeout);
```

## Development Workflow

1. **Understand the Change**: Analyze existing patterns before modifying
2. **Maintain Performance**: Run performance tests before and after changes
3. **Follow Conventions**: Apply Bright Data coding style consistently
4. **Test Thoroughly**: Use provided example files for validation
5. **Document Impact**: Note any API changes or performance implications

## File Structure Guidelines

- `/src/api/` - Core API implementations
- `/examples/` - Usage examples and performance tests
- `/src/utils/` - Shared utilities and validation
- `/src/exceptions/` - Custom error classes

## Testing Requirements

- All changes must pass existing example file executions
- Performance benchmarks must remain within 5% of baseline
- Error handling must be preserved for edge cases
- Batch operations must handle mixed success/failure scenarios

## Common Pitfalls to Avoid

- Don't replace sync-request in single URL operations
- Don't add unnecessary timeouts that slow responses
- Don't change return value formats
- Don't remove existing error handling
- Don't break existing validation logic

Remember: The goal is to maintain blazing-fast performance while improving code quality and reliability.