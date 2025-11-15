# Verbose Logging

Detailed debugging and tracing with comprehensive request lifecycle logging.

## 📋 Table of Contents

- [Overview](#overview)
- [Configuration](#configuration)
- [Log Categories](#log-categories)
- [Examples](#examples)
- [Best Practices](#best-practices)

## Overview

Verbose logging provides detailed insights into request execution, perfect for debugging and monitoring request flow.

### Key Features

- **Comprehensive Logging** - Every stage of request lifecycle
- **Emoji Icons** - Visual categorization of log types
- **Configurable Levels** - Enable specific categories or all
- **Retry Awareness** - Attempt numbers in logs
- **Performance Tracking** - Timing information included

## Configuration

### Enable All Verbose Logs

```javascript
import { createLuminara } from 'luminara';

const api = createLuminara({
  verbose: true  // Enable all verbose logging
});
```

### Selective Verbose Logging

```javascript
const api = createLuminara({
  verbose: {
    network: true,      // Network requests/responses
    retry: true,        // Retry attempts
    hedging: true,      // Hedging operations
    rateLimit: true,    // Rate limiting
    dedup: true,        // Deduplication
    debounce: true,     // Debouncing
    plugins: true,      // Plugin execution
    errors: true        // Error details
  }
});
```

### Disable Verbose Logging

```javascript
const api = createLuminara({
  verbose: false  // No verbose logs (default)
});
```

## Log Categories

### 🌐 Network Logs

Request/response details:

```javascript
const api = createLuminara({
  verbose: { network: true }
});

await api.get('https://jsonplaceholder.typicode.com/posts/1');

// Logs:
// 🌐 [Network] GET https://jsonplaceholder.typicode.com/posts/1
// 🌐 [Network] Response 200 OK (245ms)
```

### 🔄 Retry Logs

Retry attempt tracking:

```javascript
const api = createLuminara({
  verbose: { retry: true },
  retry: 3,
  retryDelay: 1000
});

await api.get('https://httpbin.org/status/500');

// Logs:
// 🔄 [Retry] Attempt 1/3 failed (500 Internal Server Error)
// 🔄 [Retry] Waiting 1000ms before retry (exponential backoff)
// 🔄 [Retry] Attempt 2/3 failed (500 Internal Server Error)
// 🔄 [Retry] Waiting 2000ms before retry (exponential backoff)
// 🔄 [Retry] Attempt 3/3 failed (500 Internal Server Error)
// 🔄 [Retry] All retries exhausted
```

### 🏎️ Hedging Logs

Hedging operation tracking:

```javascript
const api = createLuminara({
  verbose: { hedging: true },
  hedging: {
    policy: 'race',
    delay: 100
  }
});

await api.get('/api/data');

// Logs:
// 🏎️ [Hedging] Starting primary request
// 🏎️ [Hedging] Primary delayed 100ms, starting hedged request
// 🏎️ [Hedging] Hedged request completed first (145ms)
// 🏎️ [Hedging] Canceling primary request
```

### ⏱️ Rate Limit Logs

Rate limiting activity:

```javascript
const api = createLuminara({
  verbose: { rateLimit: true },
  rateLimit: {
    rps: 2,
    burst: 5
  }
});

// Fire multiple requests
for (let i = 0; i < 10; i++) {
  api.get('/api/data');
}

// Logs:
// ⏱️ [RateLimit] Token available, executing immediately
// ⏱️ [RateLimit] Token available, executing immediately
// ⏱️ [RateLimit] No tokens, queuing request
// ⏱️ [RateLimit] No tokens, queuing request
// ⏱️ [RateLimit] Token refilled, executing queued request
```

### 🔑 Deduplication Logs

Duplicate request merging:

```javascript
const api = createLuminara({
  verbose: { dedup: true },
  deduplicateRequests: true
});

await Promise.all([
  api.get('/api/data'),
  api.get('/api/data'),
  api.get('/api/data')
]);

// Logs:
// 🔑 [Dedup] New unique request
// 🔑 [Dedup] Duplicate detected, merging with in-flight request
// 🔑 [Dedup] Duplicate detected, merging with in-flight request
// 🔑 [Dedup] Primary request completed, resolving 2 duplicates
```

### ⏸️ Debounce Logs

Debouncing activity:

```javascript
const api = createLuminara({
  verbose: { debounce: true },
  debounce: 300
});

// Rapid requests
api.get('/api/search?q=j');
api.get('/api/search?q=ja');
api.get('/api/search?q=jav');

// Logs:
// ⏸️ [Debounce] Starting debounce timer (300ms)
// ⏸️ [Debounce] Canceling previous request, restarting timer
// ⏸️ [Debounce] Canceling previous request, restarting timer
// ⏸️ [Debounce] Timer expired, executing request
```

### 🔌 Plugin Logs

Plugin execution tracking:

```javascript
const api = createLuminara({
  verbose: { plugins: true }
});

api.use({
  name: 'auth-plugin',
  onRequest(context) {
    context.req.headers.set('Authorization', 'Bearer token');
  }
});

await api.get('/api/data');

// Logs:
// 🔌 [Plugin] Executing onRequest: auth-plugin
// 🔌 [Plugin] onRequest completed (0.5ms)
// 🔌 [Plugin] Executing onResponse: auth-plugin
// 🔌 [Plugin] onResponse completed (0.2ms)
```

### ❌ Error Logs

Detailed error information:

```javascript
const api = createLuminara({
  verbose: { errors: true }
});

try {
  await api.get('https://httpbin.org/status/404');
} catch (error) {
  // Logs:
  // ❌ [Error] HttpError: 404 Not Found
  // ❌ [Error] URL: https://httpbin.org/status/404
  // ❌ [Error] Method: GET
  // ❌ [Error] Attempt: 1/1
}
```

## Examples

### Example 1: Full Verbose Logging

```javascript
const api = createLuminara({
  verbose: true,  // Enable everything
  retry: 2,
  retryDelay: 1000,
  backoffStrategy: 'exponential'
});

await api.get('https://httpbin.org/status/503');

// Complete log output:
// 🌐 [Network] GET https://httpbin.org/status/503
// 🔌 [Plugin] Executing onRequest pipeline
// 🌐 [Network] Request executing (attempt 1/2)
// 🌐 [Network] Response 503 Service Unavailable (123ms)
// 🔄 [Retry] Attempt 1/2 failed (503 Service Unavailable)
// 🔄 [Retry] Waiting 1000ms before retry (exponential backoff)
// 🌐 [Network] Request executing (attempt 2/2)
// 🌐 [Network] Response 503 Service Unavailable (145ms)
// 🔄 [Retry] Attempt 2/2 failed (503 Service Unavailable)
// 🔄 [Retry] All retries exhausted
// ❌ [Error] HttpError: 503 Service Unavailable
```

### Example 2: Debug Specific Feature

```javascript
// Debug retry logic only
const api = createLuminara({
  verbose: {
    retry: true,
    errors: true
  },
  retry: 3,
  retryDelay: 1000
});

try {
  await api.get('https://httpbin.org/status/500');
} catch (error) {
  console.error('Final error:', error.message);
}

// Focused logs:
// 🔄 [Retry] Attempt 1/3 failed (500 Internal Server Error)
// 🔄 [Retry] Waiting 1000ms before retry
// 🔄 [Retry] Attempt 2/3 failed (500 Internal Server Error)
// 🔄 [Retry] Waiting 2000ms before retry
// 🔄 [Retry] Attempt 3/3 failed (500 Internal Server Error)
// ❌ [Error] HttpError: 500 Internal Server Error
```

### Example 3: Production Monitoring

```javascript
// Minimal production logging
const api = createLuminara({
  verbose: {
    network: false,
    retry: true,        // Track retry activity
    errors: true,       // Log all errors
    rateLimit: true     // Monitor rate limiting
  },
  retry: 3,
  rateLimit: { rps: 10, burst: 20 }
});

// Only logs retries, errors, and rate limit events
```

### Example 4: Custom Verbose Logger

```javascript
const api = createLuminara({
  verbose: true
});

// Intercept and format verbose logs
api.use({
  name: 'custom-logger',
  onRequest(context) {
    console.log(`
      ┌─ REQUEST START ─────────────
      │ Method: ${context.req.method}
      │ URL: ${context.req.url}
      │ Attempt: ${context.attempt}/${context.maxRetries}
      │ Timestamp: ${new Date().toISOString()}
      └─────────────────────────────
    `);
  },
  onResponse(context) {
    console.log(`
      ┌─ RESPONSE RECEIVED ─────────
      │ Status: ${context.res.status}
      │ Duration: ${Date.now() - context.timestamp}ms
      │ Data size: ${JSON.stringify(context.res.data).length} bytes
      └─────────────────────────────
    `);
    return context.res;
  }
});
```

### Example 5: Verbose + Stats Integration

```javascript
const api = createLuminara({
  verbose: { network: true, retry: true },
  statsEnabled: true,
  retry: 3
});

// Make requests
for (let i = 0; i < 20; i++) {
  try {
    await api.get(`https://jsonplaceholder.typicode.com/posts/${i}`);
  } catch (error) {
    // Errors logged automatically
  }
}

// Verbose logs show individual requests
// Stats provide aggregate metrics
const stats = api.stats();
console.log(`
  📊 Summary:
  Total Requests: ${stats.counter.get().totalRequests}
  Success Rate: ${(1 - stats.errors.get().errorRate) * 100}%
  Avg Response Time: ${stats.timing.get().averageResponseTime}ms
`);
```

### Example 6: Conditional Verbose Logging

```javascript
const isDevelopment = process.env.NODE_ENV === 'development';

const api = createLuminara({
  verbose: isDevelopment ? true : {
    errors: true  // Only errors in production
  },
  retry: 3
});

// Development: Full verbose logs
// Production: Only errors
```

### Example 7: Verbose with Hedging

```javascript
const api = createLuminara({
  verbose: { hedging: true, network: true },
  hedging: {
    policy: 'race',
    delay: 50
  }
});

await api.get('/api/slow-endpoint');

// Logs:
// 🌐 [Network] GET /api/slow-endpoint (primary)
// 🏎️ [Hedging] Primary delayed 50ms, starting hedged request
// 🌐 [Network] GET /api/slow-endpoint (hedged)
// 🌐 [Network] Hedged response 200 OK (75ms)
// 🏎️ [Hedging] Hedged request won race
// 🏎️ [Hedging] Canceling primary request
```

### Example 8: File-Based Verbose Logging

```javascript
const fs = require('fs');
const logStream = fs.createWriteStream('luminara.log', { flags: 'a' });

const api = createLuminara({
  verbose: true
});

// Redirect console logs to file
const originalLog = console.log;
console.log = (...args) => {
  logStream.write(args.join(' ') + '\n');
  originalLog(...args);
};

// All verbose logs written to luminara.log
await api.get('/api/data');
```

## Best Practices

### ✅ DO

- **Enable in development** - Use verbose for debugging
- **Selective in production** - Only log errors/critical events
- **Use with stats** - Combine verbose + stats for complete picture
- **Filter by category** - Enable only relevant categories
- **Monitor performance** - Verbose logging has small overhead

### ❌ DON'T

- **Enable all in production** - Too much noise, performance impact
- **Ignore verbose output** - Rich debugging information available
- **Log sensitive data** - Verbose logs may contain request/response data
- **Use instead of proper logging** - Complement, don't replace, app logging

## Verbose Logging Performance

**Overhead**: <0.1ms per log statement  
**Production**: Disable or minimize verbose logging  
**Development**: Full verbose recommended

## Log Format

All verbose logs follow this pattern:

```
[Emoji] [Category] Message
```

Examples:
- `🌐 [Network] GET /api/users`
- `🔄 [Retry] Attempt 2/3 failed`
- `🔑 [Dedup] Duplicate detected`
- `❌ [Error] HttpError: 404 Not Found`

## See Also

- [Stats System](./stats.md)
- [Interceptors](./interceptors.md)
- [Error Handling](./error-handling.md)
- [Retry System](./retry.md)

---

**📖 [Back to Features Documentation](./README.md)**
