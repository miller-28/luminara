# Backoff Strategies

Six flexible backoff strategies for intelligent retry timing.

## 📋 Table of Contents

- [Overview](#overview)
- [Available Strategies](#available-strategies)
- [Configuration](#configuration)
- [Examples](#examples)
- [Best Practices](#best-practices)

## Overview

Backoff strategies control the delay between retry attempts, preventing server overload while maximizing success chances.

### Key Features

- **6 Built-in Strategies** - Exponential, Fibonacci, Jitter, Linear, Polynomial, Custom
- **Configurable Parameters** - Base delay, multiplier, max delay
- **Custom Functions** - Write your own backoff logic
- **Stats Integration** - Track retry timing metrics

## Available Strategies

### 1. Exponential Backoff (Default)

Doubles delay each attempt: **1s → 2s → 4s → 8s**

```javascript
const api = createLuminara({
  retry: 4,
  retryDelay: 1000,
  backoffStrategy: 'exponential'  // Default
});

// Delays: 1000ms, 2000ms, 4000ms, 8000ms
```

**Best for**: Most scenarios, balances speed and server load

### 2. Fibonacci Backoff

Follows Fibonacci sequence: **1s → 1s → 2s → 3s → 5s → 8s**

```javascript
const api = createLuminara({
  retry: 6,
  retryDelay: 1000,
  backoffStrategy: 'fibonacci'
});

// Delays: 1000ms, 1000ms, 2000ms, 3000ms, 5000ms, 8000ms
```

**Best for**: More gradual increase than exponential

### 3. Jitter Backoff

Exponential + random variance: **1.2s → 2.8s → 3.5s → 7.9s**

```javascript
const api = createLuminara({
  retry: 4,
  retryDelay: 1000,
  backoffStrategy: 'jitter'
});

// Delays: Random between baseDelay and exponential
// Example: 1200ms, 2800ms, 3500ms, 7900ms
```

**Best for**: Preventing thundering herd, distributed systems

### 4. Linear Backoff

Constant increment: **1s → 2s → 3s → 4s**

```javascript
const api = createLuminara({
  retry: 4,
  retryDelay: 1000,
  backoffStrategy: 'linear'
});

// Delays: 1000ms, 2000ms, 3000ms, 4000ms
```

**Best for**: Predictable timing, rate-limited APIs

### 5. Polynomial Backoff

Power-based growth: **1s → 4s → 9s → 16s** (default: squared)

```javascript
const api = createLuminara({
  retry: 4,
  retryDelay: 1000,
  backoffStrategy: 'polynomial',
  backoffMultiplier: 2  // Exponent (default: 2)
});

// Delays: 1000ms, 4000ms, 9000ms, 16000ms
```

**Best for**: Aggressive backoff for critical services

### 6. Custom Function

Write your own backoff logic:

```javascript
const api = createLuminara({
  retry: 4,
  retryDelay: 1000,
  backoffStrategy: (attempt, baseDelay) => {
    // Custom logic: cap at 5 seconds
    return Math.min(baseDelay * attempt, 5000);
  }
});

// Delays: 1000ms, 2000ms, 3000ms, 4000ms (all attempts)
```

**Best for**: Unique requirements, complex retry logic

## Configuration

### Basic Configuration

```javascript
const api = createLuminara({
  retry: 3,                      // Max attempts
  retryDelay: 1000,              // Base delay (ms)
  backoffStrategy: 'exponential', // Strategy
  maxRetryDelay: 10000           // Cap delay at 10s
});
```

### Advanced Configuration

```javascript
const api = createLuminara({
  retry: 5,
  retryDelay: 500,
  backoffStrategy: 'polynomial',
  backoffMultiplier: 3,          // For polynomial: attempt^3
  maxRetryDelay: 30000,          // Max 30 seconds
  retryStatusCodes: [408, 429, 500, 502, 503, 504]
});
```

### Per-Request Override

```javascript
// Override global strategy
await api.get('/api/critical', {
  retry: 5,
  retryDelay: 2000,
  backoffStrategy: 'jitter'
});
```

## Examples

### Example 1: Exponential Backoff

```javascript
const api = createLuminara({
  retry: 4,
  retryDelay: 1000,
  backoffStrategy: 'exponential',
  verbose: true
});

try {
  await api.get('https://httpbin.org/status/503');
} catch (error) {
  // Verbose logs show:
  // Attempt 1 failed, retrying after 1000ms
  // Attempt 2 failed, retrying after 2000ms
  // Attempt 3 failed, retrying after 4000ms
  // Attempt 4 failed, retrying after 8000ms
  // Total time: ~15 seconds
}
```

### Example 2: Fibonacci Backoff

```javascript
const api = createLuminara({
  retry: 6,
  retryDelay: 1000,
  backoffStrategy: 'fibonacci',
  verbose: true
});

try {
  await api.get('https://httpbin.org/status/500');
} catch (error) {
  // Delays: 1s, 1s, 2s, 3s, 5s, 8s
  // Total time: ~20 seconds
}
```

### Example 3: Jitter Backoff (Prevent Thundering Herd)

```javascript
const api = createLuminara({
  retry: 4,
  retryDelay: 1000,
  backoffStrategy: 'jitter'
});

// Simulate 100 clients retrying simultaneously
const clients = Array.from({ length: 100 }, () => {
  return api.get('https://httpbin.org/status/503').catch(() => {});
});

await Promise.all(clients);

// Jitter spreads retry attempts:
// Without jitter: All 100 clients retry at exact same time
// With jitter: Clients retry at random intervals (reduced server load)
```

### Example 4: Linear Backoff

```javascript
const api = createLuminara({
  retry: 5,
  retryDelay: 2000,
  backoffStrategy: 'linear',
  verbose: true
});

try {
  await api.get('https://httpbin.org/status/429'); // Rate limited
} catch (error) {
  // Delays: 2s, 4s, 6s, 8s, 10s
  // Predictable timing for rate-limited APIs
}
```

### Example 5: Polynomial Backoff

```javascript
const api = createLuminara({
  retry: 4,
  retryDelay: 1000,
  backoffStrategy: 'polynomial',
  backoffMultiplier: 2,  // Squared
  verbose: true
});

try {
  await api.get('https://httpbin.org/status/502');
} catch (error) {
  // Delays: 1s (1^2), 4s (2^2), 9s (3^2), 16s (4^2)
  // Aggressive backoff for critical services
}
```

### Example 6: Custom Backoff Function

```javascript
const api = createLuminara({
  retry: 5,
  retryDelay: 1000,
  backoffStrategy: (attempt, baseDelay) => {
    // Custom: Double until 5s, then constant
    const calculated = baseDelay * Math.pow(2, attempt - 1);
    return Math.min(calculated, 5000);
  },
  verbose: true
});

try {
  await api.get('https://httpbin.org/status/503');
} catch (error) {
  // Delays: 1s, 2s, 4s, 5s, 5s
  // Caps at 5 seconds after attempt 3
}
```

### Example 7: Comparing All Strategies

```javascript
async function compareStrategies() {
  const strategies = [
    'exponential',
    'fibonacci', 
    'jitter',
    'linear',
    'polynomial'
  ];
  
  for (const strategy of strategies) {
    const api = createLuminara({
      retry: 4,
      retryDelay: 1000,
      backoffStrategy: strategy,
      verbose: true
    });
    
    console.log(`\n=== Testing ${strategy} ===`);
    const startTime = Date.now();
    
    try {
      await api.get('https://httpbin.org/status/500');
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.log(`Total time: ${totalTime}ms`);
    }
  }
}

// Results:
// exponential: ~15s (1s + 2s + 4s + 8s)
// fibonacci: ~14s (1s + 1s + 2s + 3s + 5s + 8s for 6 retries)
// jitter: ~12-18s (random variance)
// linear: ~10s (1s + 2s + 3s + 4s)
// polynomial: ~30s (1s + 4s + 9s + 16s)
```

### Example 8: Max Retry Delay Cap

```javascript
const api = createLuminara({
  retry: 10,
  retryDelay: 1000,
  backoffStrategy: 'exponential',
  maxRetryDelay: 5000  // Cap at 5 seconds
});

try {
  await api.get('https://httpbin.org/status/503');
} catch (error) {
  // Delays: 1s, 2s, 4s, 5s, 5s, 5s, 5s, 5s, 5s, 5s
  // After 4s, capped at maxRetryDelay
}
```

## Best Practices

### ✅ DO

- **Use exponential for most cases** - Good balance of speed and load
- **Use jitter for distributed systems** - Prevents synchronized retries
- **Use linear for rate limits** - Predictable timing matches rate windows
- **Cap max delay** - Prevent infinite backoff with `maxRetryDelay`
- **Monitor retry stats** - Track which strategies work best

### ❌ DON'T

- **Use linear for transient errors** - Too aggressive for temporary issues
- **Use polynomial without cap** - Can lead to extremely long delays
- **Ignore jitter** - Synchronized retries can overload servers
- **Use same strategy everywhere** - Different endpoints need different strategies

## Strategy Comparison

| Strategy | Growth Rate | Best For | Total Time (4 retries, 1s base) |
|----------|-------------|----------|----------------------------------|
| **Exponential** | 2^n | General use | ~15s |
| **Fibonacci** | Fib(n) | Gradual increase | ~14s (6 retries) |
| **Jitter** | 2^n + random | Distributed systems | ~12-18s |
| **Linear** | n | Rate limits | ~10s |
| **Polynomial** | n^2 | Critical services | ~30s |
| **Custom** | Your logic | Unique needs | Variable |

## When to Use Each Strategy

### Exponential ✅
- **General purpose** - Works well for most scenarios
- **Transient errors** - Network issues, temporary outages
- **Cloud services** - AWS, Azure, GCP recommended approach

### Fibonacci ✅
- **Gradual escalation** - Less aggressive than exponential
- **User-facing requests** - Faster initial retries
- **Rate-limited APIs** - Better than exponential for rate limits

### Jitter ✅
- **Distributed systems** - Multiple clients retrying
- **Microservices** - Prevent thundering herd
- **Load balancers** - Spread retry traffic

### Linear ✅
- **Rate-limited APIs** - Predictable timing
- **Quota management** - Match retry to quota refresh
- **Time-windowed limits** - Align with rate windows

### Polynomial ✅
- **Critical infrastructure** - Aggressive backoff
- **Expensive operations** - Database writes, reports
- **Rare operations** - Don't retry often

### Custom Function ✅
- **Complex requirements** - Multi-stage backoff
- **Business logic** - Domain-specific retry logic
- **Hybrid strategies** - Combine multiple approaches

## See Also

- [Retry System](./retry.md)
- [Request Hedging](./request-hedging.md)
- [Error Handling](./error-handling.md)

---

**📖 [Back to Features Documentation](./README.md)**
