# Retry System

Comprehensive retry system with 6 backoff strategies, custom retry policies, and fine-grained control.

## 📋 Table of Contents

- [Overview](#overview)
- [Basic Usage](#basic-usage)
- [Backoff Strategies](#backoff-strategies)
- [Retry Policies](#retry-policies)
- [Configuration Options](#configuration-options)
- [Examples](#examples)

## Overview

Luminara's retry system automatically retries failed requests with configurable backoff strategies, making your application more resilient to transient failures.

### Key Features

- **6 Built-in Backoff Strategies** - Exponential, Fibonacci, Jitter, Linear, Polynomial, Custom
- **Retry Policies** - Control which requests should be retried
- **Status Code Filtering** - Retry specific HTTP status codes
- **Custom Retry Logic** - Build your own retry decision function
- **Stats Integration** - Track retry attempts and success rates

## Basic Usage

```javascript
import { createLuminara } from 'luminara';

const api = createLuminara({
  retry: 3,              // Retry up to 3 times
  retryDelay: 1000,      // Wait 1 second between retries
  backoffType: 'exponential'  // Use exponential backoff
});

const response = await api.get('https://api.example.com/data');
```

## Backoff Strategies

### 1. Exponential (Default)

Delay doubles after each retry: `delay * (2 ^ attempt)`

```javascript
{
  retry: 4,
  retryDelay: 1000,
  backoffType: 'exponential'
}
// Delays: 1s, 2s, 4s, 8s
```

### 2. Fibonacci

Uses Fibonacci sequence for delays:

```javascript
{
  retry: 5,
  retryDelay: 500,
  backoffType: 'fibonacci'
}
// Delays: 500ms, 500ms, 1000ms, 1500ms, 2500ms
```

### 3. Jitter

Adds randomization to prevent thundering herd:

```javascript
{
  retry: 3,
  retryDelay: 1000,
  backoffType: 'jitter',
  jitterRange: 0.3  // ±30% randomization
}
// Delays: 700-1300ms, 700-1300ms, 700-1300ms
```

### 4. Linear

Constant delay between retries:

```javascript
{
  retry: 3,
  retryDelay: 2000,
  backoffType: 'linear'
}
// Delays: 2s, 2s, 2s
```

### 5. Polynomial

Polynomial growth: `delay * (attempt ^ exponent)`

```javascript
{
  retry: 4,
  retryDelay: 500,
  backoffType: 'polynomial',
  backoffExponent: 3
}
// Delays: 500ms, 4000ms, 13500ms, 32000ms
```

### 6. Custom Function

Complete control over retry timing:

```javascript
{
  retry: 3,
  retryDelay: (attempt, error, req) => {
    // Exponential with cap
    return Math.min(1000 * Math.pow(2, attempt), 10000);
  }
}
```

## Retry Policies

Control which requests should be retried based on HTTP method:

### Default Policy (Idempotent Only)

```javascript
// Retries: GET, HEAD, OPTIONS, PUT, DELETE
// Skips: POST, PATCH
const api = createLuminara({
  retry: 3
});
```

### Retry All Methods

```javascript
const api = createLuminara({
  retry: 3,
  retryPolicy: () => true  // Retry everything
});
```

### Custom Policy

```javascript
const api = createLuminara({
  retry: 3,
  retryPolicy: (error, req) => {
    // Only retry GET requests with 5xx errors
    return req.method === 'GET' && error.status >= 500;
  }
});
```

## Configuration Options

### Full Configuration

```javascript
const api = createLuminara({
  // Basic retry config
  retry: 3,                    // Number of retry attempts (false/0 to disable)
  retryDelay: 1000,            // Base delay in milliseconds
  backoffType: 'exponential',  // Strategy type
  
  // Advanced options
  retryStatusCodes: [408, 429, 500, 502, 503, 504],  // HTTP codes to retry
  retryPolicy: (error, req) => true,  // Custom retry decision
  jitterRange: 0.2,            // For jitter backoff (±20%)
  backoffExponent: 2,          // For polynomial backoff
  
  // Retry with timeout
  timeout: 5000,               // Fail fast, then retry
  
  // Stats tracking
  statsEnabled: true
});
```

### Per-Request Override

```javascript
// Disable retry for specific request
await api.post('/api/payment', data, {
  retry: false
});

// Custom retry for specific request
await api.get('/api/unstable', {
  retry: 5,
  backoffType: 'fibonacci'
});
```

### Status Code Filtering

```javascript
const api = createLuminara({
  retry: 3,
  retryStatusCodes: [
    408,  // Request Timeout
    429,  // Too Many Requests
    500,  // Internal Server Error
    502,  // Bad Gateway
    503,  // Service Unavailable
    504   // Gateway Timeout
  ]
});
```

## Examples

### Example 1: Exponential Backoff with Jitter

```javascript
const api = createLuminara({
  retry: 4,
  retryDelay: 1000,
  backoffType: 'exponential',
  jitterRange: 0.25  // ±25%
});

try {
  const response = await api.get('https://api.example.com/data');
  console.log('Success:', response.data);
} catch (error) {
  console.error('All retries failed:', error.message);
}
```

### Example 2: Retry with Stats Tracking

```javascript
const api = createLuminara({
  retry: 3,
  backoffType: 'fibonacci',
  statsEnabled: true
});

await api.get('https://api.example.com/unreliable');

// Check retry stats
const retryStats = api.stats().retry.get();
console.log(`Total attempts: ${retryStats.totalAttempts}`);
console.log(`Successful retries: ${retryStats.successfulRetries}`);
console.log(`Failed after retries: ${retryStats.failedAfterRetries}`);
```

### Example 3: Conditional Retry Policy

```javascript
const api = createLuminara({
  retry: 3,
  retryPolicy: (error, req) => {
    // Don't retry client errors (4xx)
    if (error.status >= 400 && error.status < 500) {
      return false;
    }
    
    // Always retry network errors
    if (error.type === 'NetworkError') {
      return true;
    }
    
    // Retry server errors for GET only
    return req.method === 'GET' && error.status >= 500;
  }
});
```

### Example 4: Retry with Interceptor

```javascript
const api = createLuminara({
  retry: 3,
  backoffType: 'exponential'
});

api.use({
  name: 'retry-logger',
  onRequest(context) {
    if (context.attempt > 1) {
      console.log(`Retry attempt ${context.attempt}/${context.maxRetries}`);
    }
  },
  onResponseError(context) {
    console.error(`Request failed (attempt ${context.attempt}):`, context.error.message);
  }
});

await api.get('https://api.example.com/flaky');
```

## Disabling Retry

```javascript
// Globally disable
const api = createLuminara({
  retry: false  // or retry: 0
});

// Per-request disable
await api.post('/api/critical', data, {
  retry: false
});
```

## Retry vs Hedging

| Feature | Retry | Hedging |
|---------|-------|---------|
| **Timing** | Sequential | Concurrent |
| **Use case** | Reliability | Latency |
| **Resource usage** | Lower | Higher |
| **Best for** | Transient failures | Tail latency |

## See Also

- [Backoff Strategies](./backoff-strategies.md)
- [Request Hedging](./request-hedging.md)
- [Stats System](./stats.md)
- [Error Handling](./error-handling.md)

---

**📖 [Back to Features Documentation](./README.md)**
