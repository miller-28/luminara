# Timeout Configuration

Configurable request timeouts with automatic abort controller management.

## 📋 Table of Contents

- [Overview](#overview)
- [Configuration](#configuration)
- [Timeout Behavior](#timeout-behavior)
- [Examples](#examples)
- [Best Practices](#best-practices)

## Overview

Luminara provides flexible timeout configuration to prevent requests from hanging indefinitely, with automatic cleanup and error handling.

### Key Features

- **Global Timeout** - Set default timeout for all requests
- **Per-Request Override** - Custom timeout for specific requests
- **Automatic Cleanup** - AbortController managed automatically
- **Detailed Errors** - TimeoutError with context
- **Stats Integration** - Timeout metrics tracked

## Configuration

### Global Timeout

```javascript
import { createLuminara } from 'luminara';

const api = createLuminara({
  timeout: 5000  // 5 seconds for all requests
});
```

### Per-Request Timeout

```javascript
// Override global timeout
await api.get('/api/data', {
  timeout: 10000  // 10 seconds for this request
});

// Disable timeout for specific request
await api.get('/api/large-file', {
  timeout: 0  // No timeout
});
```

### Disable Timeout

```javascript
// No timeout by default
const api = createLuminara({
  timeout: 0  // Disabled
});

// Enable for specific request
await api.get('/api/data', {
  timeout: 3000
});
```

## Timeout Behavior

### What Happens on Timeout

1. **Timer expires** → AbortController signals abort
2. **Request canceled** → Network call terminated
3. **TimeoutError thrown** → Caught by error handlers
4. **Cleanup** → Resources freed automatically

### Error Structure

```javascript
try {
  await api.get('/api/slow-endpoint', { timeout: 1000 });
} catch (error) {
  console.log(error.name);       // 'TimeoutError'
  console.log(error.message);    // 'Request timeout after 1000ms'
  console.log(error.url);        // '/api/slow-endpoint'
  console.log(error.timeout);    // 1000
}
```

## Examples

### Example 1: Basic Timeout

```javascript
const api = createLuminara({
  timeout: 3000  // 3 seconds
});

try {
  const response = await api.get('https://httpbin.org/delay/5');
  // This won't execute (request times out after 3s)
} catch (error) {
  if (error.name === 'TimeoutError') {
    console.error('Request timed out!');
  }
}
```

### Example 2: Different Timeouts per Endpoint

```javascript
const api = createLuminara({
  timeout: 5000  // Default 5 seconds
});

// Fast endpoint - short timeout
const users = await api.get('/api/users', {
  timeout: 2000  // 2 seconds
});

// Slow endpoint - long timeout
const report = await api.get('/api/generate-report', {
  timeout: 30000  // 30 seconds
});

// No timeout for file upload
await api.post('/api/upload', fileData, {
  timeout: 0  // Unlimited
});
```

### Example 3: Timeout with Retry

```javascript
const api = createLuminara({
  timeout: 5000,
  retry: 3,
  retryDelay: 1000
});

try {
  // Will retry up to 3 times if timeout occurs
  const response = await api.get('https://httpbin.org/delay/10');
} catch (error) {
  if (error.name === 'TimeoutError') {
    console.error('Request timed out after 3 retries');
  }
}

// Timeline:
// Attempt 1: 5s → timeout
// Wait: 1s
// Attempt 2: 5s → timeout
// Wait: 1s
// Attempt 3: 5s → timeout
// Total: ~18 seconds before final failure
```

### Example 4: Progressive Timeout

```javascript
const api = createLuminara();

async function fetchWithProgressiveTimeout(url) {
  const timeouts = [3000, 5000, 10000];
  
  for (let attempt = 0; attempt < timeouts.length; attempt++) {
    try {
      console.log(`Attempt ${attempt + 1} with ${timeouts[attempt]}ms timeout`);
      
      return await api.get(url, {
        timeout: timeouts[attempt]
      });
    } catch (error) {
      if (error.name === 'TimeoutError' && attempt < timeouts.length - 1) {
        console.log('Timeout, trying with longer timeout...');
        continue;
      }
      throw error;
    }
  }
}

// Attempt 1: 3s timeout
// Attempt 2: 5s timeout
// Attempt 3: 10s timeout
```

### Example 5: Timeout with Loading UI

```javascript
const api = createLuminara({
  timeout: 10000
});

async function loadDataWithTimeout() {
  const loadingIndicator = showLoading();
  const startTime = Date.now();
  
  try {
    const response = await api.get('/api/data');
    
    const elapsedTime = Date.now() - startTime;
    console.log(`Loaded in ${elapsedTime}ms`);
    
    displayData(response.data);
  } catch (error) {
    if (error.name === 'TimeoutError') {
      showError('Request took too long. Please try again.');
    } else {
      showError('Failed to load data');
    }
  } finally {
    hideLoading(loadingIndicator);
  }
}
```

### Example 6: Timeout Monitoring with Stats

```javascript
const api = createLuminara({
  timeout: 5000,
  statsEnabled: true,
  verbose: true
});

// Make requests
for (let i = 0; i < 100; i++) {
  try {
    await api.get(`https://httpbin.org/delay/${Math.random() * 10}`);
  } catch (error) {
    // Timeouts tracked automatically
  }
}

// Check timeout metrics
const errorStats = api.stats().errors.get();
const timeoutErrors = errorStats.byType['TimeoutError'] || 0;

console.log(`Total requests: ${api.stats().counter.get().totalRequests}`);
console.log(`Timeout errors: ${timeoutErrors}`);
console.log(`Timeout rate: ${(timeoutErrors / 100 * 100).toFixed(1)}%`);
```

### Example 7: Race with Timeout

```javascript
const api = createLuminara();

async function fetchWithFallback(primaryUrl, fallbackUrl) {
  try {
    // Try primary with short timeout
    return await api.get(primaryUrl, {
      timeout: 2000
    });
  } catch (error) {
    if (error.name === 'TimeoutError') {
      console.log('Primary timed out, trying fallback');
      
      // Fallback with longer timeout
      return await api.get(fallbackUrl, {
        timeout: 5000
      });
    }
    throw error;
  }
}

const data = await fetchWithFallback(
  'https://api-primary.example.com/data',
  'https://api-backup.example.com/data'
);
```

### Example 8: Custom Abort Controller

```javascript
const api = createLuminara({
  timeout: 5000  // Default timeout
});

// Create custom abort controller for manual cancellation
const controller = new AbortController();

// Cancel button
document.querySelector('#cancel-btn').addEventListener('click', () => {
  controller.abort();
  console.log('Request canceled by user');
});

try {
  const response = await api.get('/api/data', {
    signal: controller.signal  // Use custom controller
  });
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Request was aborted');
  }
}
```

## Best Practices

### ✅ DO

- **Set reasonable defaults** - 5-10 seconds for most APIs
- **Tune per endpoint** - Fast endpoints get short timeouts
- **Use with retry** - Combine timeout + retry for resilience
- **Handle TimeoutError** - Provide user-friendly error messages
- **Monitor timeout rate** - Use stats to identify slow endpoints

### ❌ DON'T

- **Set timeout too short** - <1000ms likely too aggressive
- **Use same timeout for all endpoints** - Fast and slow endpoints differ
- **Ignore timeout errors** - Always handle TimeoutError explicitly
- **Disable timeout carelessly** - Hanging requests waste resources

## Timeout Guidelines by Endpoint Type

| Endpoint Type | Recommended Timeout | Example |
|---------------|---------------------|---------|
| **Fast API** | 2-5 seconds | User profile, simple queries |
| **Standard API** | 5-10 seconds | List endpoints, basic CRUD |
| **Slow API** | 15-30 seconds | Reports, aggregations |
| **File Upload** | 60+ seconds or 0 | Large file uploads |
| **Streaming** | 0 (disabled) | Server-sent events, WebSocket |

## Timeout with Other Features

### With Retry

```javascript
const api = createLuminara({
  timeout: 5000,
  retry: 3,
  retryDelay: 1000
});

// Will retry on timeout
// Total max time: ~18s (3 attempts × 5s + 2 waits × 1s)
```

### With Hedging

```javascript
const api = createLuminara({
  timeout: 10000,
  hedging: {
    policy: 'race',
    delay: 100
  }
});

// Each hedged request has 10s timeout
// Whichever completes first (within timeout) wins
```

### With Debouncing

```javascript
const api = createLuminara({
  timeout: 5000,
  debounce: 300
});

// Debounce delays request start
// Timeout applies after debounce delay ends
```

## Performance Impact

**Memory**: Negligible (<1KB per timeout)  
**CPU**: <0.01ms per request  
**Benefit**: Prevents hanging requests, frees resources

## See Also

- [Retry System](./retry.md)
- [Request Hedging](./request-hedging.md)
- [Error Handling](./error-handling.md)

---

**📖 [Back to Features Documentation](./README.md)**
