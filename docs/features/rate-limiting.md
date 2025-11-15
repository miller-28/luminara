# Rate Limiting

Token bucket algorithm with global, domain, and endpoint scoping for precise rate control.

## 📋 Table of Contents

- [Overview](#overview)
- [Token Bucket Algorithm](#token-bucket-algorithm)
- [Scoping Levels](#scoping-levels)
- [Configuration](#configuration)
- [Examples](#examples)
- [Best Practices](#best-practices)

## Overview

Luminara's rate limiting uses the token bucket algorithm to enforce request rate limits, preventing API quota exhaustion and respecting server rate limits.

### Key Features

- **Token Bucket Algorithm** - Industry-standard rate limiting
- **Three Scoping Levels** - Global, domain, and endpoint
- **Burst Support** - Allow temporary bursts of traffic
- **Queue Management** - Automatic request queuing
- **Stats Integration** - Track rate limit metrics

## Token Bucket Algorithm

The token bucket refills at a constant rate (RPS) and holds a maximum of `burst` tokens.

```
Tokens: [🪙 🪙 🪙 🪙 🪙]  (burst capacity: 5)
Rate: 2 tokens/second     (RPS: 2)

Request arrives → Consume 1 token → Execute request
No tokens? → Queue request until token available
```

## Scoping Levels

### 1. Global Scope (Default)

Rate limit applies across ALL requests:

```javascript
const api = createLuminara({
  rateLimit: {
    rps: 10,           // 10 requests per second
    burst: 20,         // Burst capacity
    scope: 'global'    // Default
  }
});

// All requests share the same bucket
await api.get('/api/users');     // Counts toward limit
await api.get('/api/posts');     // Counts toward limit
await api.post('/api/comments'); // Counts toward limit
```

### 2. Domain Scope

Separate rate limit per domain:

```javascript
const api = createLuminara({
  rateLimit: {
    rps: 5,
    burst: 10,
    scope: 'domain'
  }
});

// Different domains have separate buckets
await api.get('https://api-1.example.com/data');  // Bucket 1
await api.get('https://api-2.example.com/data');  // Bucket 2
```

### 3. Endpoint Scope

Separate rate limit per unique endpoint:

```javascript
const api = createLuminara({
  rateLimit: {
    rps: 3,
    burst: 5,
    scope: 'endpoint'
  }
});

// Different endpoints have separate buckets
await api.get('/api/users');      // Bucket 1
await api.get('/api/posts');      // Bucket 2
await api.get('/api/users');      // Bucket 1 (same endpoint)
```

## Configuration

### Basic Configuration

```javascript
const api = createLuminara({
  rateLimit: {
    rps: 10,              // Requests per second
    burst: 20,            // Burst capacity (tokens)
    scope: 'global',      // 'global' | 'domain' | 'endpoint'
    queueTimeout: 30000   // Max wait time in queue (ms)
  }
});
```

### Per-Request Override

```javascript
// Disable rate limiting for specific request
await api.get('/api/critical', {
  rateLimit: false
});

// Custom rate limit for specific request
await api.get('/api/expensive', {
  rateLimit: {
    rps: 1,
    burst: 1
  }
});
```

### Get Rate Limit Stats

```javascript
const rateLimitStats = api.getRateLimitStats();
console.log(rateLimitStats);
// {
//   scope: 'global',
//   rps: 10,
//   burst: 20,
//   bucketsActive: 1,
//   tokensAvailable: 15,
//   requestsQueued: 0,
//   requestsThrottled: 42
// }
```

## Examples

### Example 1: Simple Rate Limit

```javascript
import { createLuminara } from 'luminara';

const api = createLuminara({
  rateLimit: {
    rps: 2,      // 2 requests per second
    burst: 5     // Allow burst of 5
  }
});

// Fire multiple requests
const promises = Array.from({ length: 10 }, (_, i) =>
  api.get(`https://jsonplaceholder.typicode.com/posts/${i + 1}`)
);

console.time('requests');
await Promise.all(promises);
console.timeEnd('requests');
// Expected: ~5 seconds (10 requests at 2 RPS)
```

### Example 2: Domain-Scoped Rate Limiting

```javascript
const api = createLuminara({
  rateLimit: {
    rps: 5,
    burst: 10,
    scope: 'domain'
  }
});

// Each domain has independent rate limit
await Promise.all([
  // api-1.example.com: 5 RPS
  api.get('https://api-1.example.com/users'),
  api.get('https://api-1.example.com/posts'),
  
  // api-2.example.com: 5 RPS (separate bucket)
  api.get('https://api-2.example.com/data'),
  api.get('https://api-2.example.com/config')
]);
```

### Example 3: Endpoint-Scoped Rate Limiting

```javascript
const api = createLuminara({
  rateLimit: {
    rps: 3,
    burst: 5,
    scope: 'endpoint'
  }
});

// Different endpoints have separate limits
await Promise.all([
  api.get('/api/users'),      // 3 RPS
  api.get('/api/posts'),      // 3 RPS (separate)
  api.get('/api/comments')    // 3 RPS (separate)
]);
```

### Example 4: Rate Limit with Stats

```javascript
const api = createLuminara({
  rateLimit: {
    rps: 10,
    burst: 20
  },
  statsEnabled: true
});

// Make some requests
for (let i = 0; i < 50; i++) {
  await api.get('https://jsonplaceholder.typicode.com/posts/1');
}

// Check stats
const stats = api.stats().rate.get();
console.log(`Requests throttled: ${stats.throttledRequests}`);
console.log(`Average wait time: ${stats.averageWaitTime}ms`);

const rateLimitStats = api.getRateLimitStats();
console.log(`Tokens available: ${rateLimitStats.tokensAvailable}/${rateLimitStats.burst}`);
```

### Example 5: Queue Timeout

```javascript
const api = createLuminara({
  rateLimit: {
    rps: 1,
    burst: 1,
    queueTimeout: 5000  // Fail after 5s in queue
  }
});

try {
  // Fire 10 requests at once
  const promises = Array.from({ length: 10 }, () =>
    api.get('https://jsonplaceholder.typicode.com/posts/1')
  );
  
  await Promise.all(promises);
} catch (error) {
  if (error.message.includes('queue timeout')) {
    console.error('Some requests timed out waiting for rate limit');
  }
}
```

### Example 6: Burst Traffic Handling

```javascript
const api = createLuminara({
  rateLimit: {
    rps: 5,       // Steady state: 5 RPS
    burst: 50     // Allow burst of 50 requests
  }
});

// Handle burst of traffic
const startTime = Date.now();

// Send 50 requests immediately (uses burst capacity)
const burst = await Promise.all(
  Array.from({ length: 50 }, () =>
    api.get('https://jsonplaceholder.typicode.com/posts/1')
  )
);

console.log(`Burst completed in ${Date.now() - startTime}ms`);
// Expected: Very fast (burst capacity consumed)

// Subsequent requests throttled to 5 RPS
const throttled = await Promise.all(
  Array.from({ length: 10 }, () =>
    api.get('https://jsonplaceholder.typicode.com/posts/1')
  )
);

console.log(`Throttled requests completed in ${Date.now() - startTime}ms`);
// Expected: ~2 seconds (10 requests at 5 RPS)
```

## Best Practices

### ✅ DO

- **Match API limits** - Set RPS to match your API provider's limits
- **Use burst for spikes** - Set burst capacity for expected traffic spikes
- **Choose appropriate scope** - Use endpoint scope for fine-grained control
- **Monitor stats** - Track throttled requests to tune configuration
- **Set queue timeout** - Prevent indefinite waiting with reasonable timeout

### ❌ DON'T

- **Set RPS too high** - Respect API provider limits
- **Use global scope for multi-API** - Use domain scope for different APIs
- **Ignore burst capacity** - Too low = artificial throttling, too high = quota burst
- **Forget about costs** - Rate limiting queues requests, doesn't reduce them

## Rate Limiting vs Throttling

| Feature | Rate Limiting | Debouncing |
|---------|---------------|------------|
| **Purpose** | Enforce max RPS | Delay rapid requests |
| **Behavior** | Queue requests | Cancel/delay requests |
| **Use case** | API quota management | User input handling |
| **Queuing** | Yes (token bucket) | No (cancellation) |

## Calculation Examples

### Example: 10 RPS, Burst 20

```
Time 0s:
- Tokens: 20/20 (full burst)
- Fire 20 requests → All execute immediately
- Tokens: 0/20

Time 1s:
- Tokens: 10/20 (refilled 10 tokens at 10 RPS)
- Fire 15 requests → 10 execute, 5 queued
- Tokens: 0/20

Time 2s:
- Tokens: 10/20 (refilled 10 tokens)
- 5 queued execute, 5 tokens remain
- Tokens: 5/20
```

## See Also

- [Request Debouncing](./debouncing.md)
- [Request Deduplication](./deduplication.md)
- [Stats System](./stats.md)

---

**📖 [Back to Features Documentation](./README.md)**
