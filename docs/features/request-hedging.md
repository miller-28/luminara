# Request Hedging

Request hedging is a latency optimization technique that sends multiple concurrent or sequential requests to reduce tail latency and improve response time predictability.

## 📋 Table of Contents

- [Overview](#overview)
- [Hedging Policies](#hedging-policies)
- [Configuration](#configuration)
- [Use Cases](#use-cases)
- [Best Practices](#best-practices)
- [Performance Implications](#performance-implications)
- [Examples](#examples)

## Overview

Request hedging helps combat unpredictable latency by sending redundant requests. When the first request takes longer than expected, additional "hedge" requests are sent to increase the probability of getting a fast response.

### Key Benefits

- **Reduced P99 Latency** - Dramatically improves worst-case response times
- **Predictable Performance** - Smooths out latency spikes
- **Fault Tolerance** - Works around slow or temporarily degraded servers
- **Zero Code Changes** - Configuration-only feature

## Hedging Policies

Luminara supports two hedging strategies:

### 1. Race Policy

Sends multiple concurrent requests and uses the fastest response.

```javascript
const api = createLuminara({
  hedging: {
    policy: 'race',
    hedgeDelay: 1000,    // Wait 1s before sending hedge
    maxHedges: 2         // Send up to 2 additional requests
  }
});
```

**Flow:**
1. Send initial request
2. If no response after `hedgeDelay`, send hedge request
3. Continue until `maxHedges` reached or response received
4. Return fastest response, cancel others

**Best for:** Read-only operations, idempotent requests

### 2. Cancel-and-Retry Policy

Cancels the previous request before sending the next one.

```javascript
const api = createLuminara({
  hedging: {
    policy: 'cancel-and-retry',
    hedgeDelay: 1500,
    maxHedges: 2
  }
});
```

**Flow:**
1. Send initial request
2. If no response after `hedgeDelay`, **cancel it** and send new request
3. Repeat until `maxHedges` reached or response received

**Best for:** Non-idempotent requests, when avoiding duplicate processing is critical

## Configuration

### Basic Configuration

```javascript
const api = createLuminara({
  hedging: {
    policy: 'race',              // 'race' | 'cancel-and-retry'
    hedgeDelay: 1000,            // Delay in ms before sending hedge
    maxHedges: 2,                // Max number of hedge requests
    exponentialBackoff: false,   // Use exponential delays
    backoffMultiplier: 2,        // Multiplier for exponential backoff
    jitter: false,               // Add randomization to delays
    jitterRange: 0.2,            // Jitter range (±20%)
    allowedMethods: ['GET', 'HEAD', 'OPTIONS']  // HTTP methods to hedge
  }
});
```

### Exponential Backoff with Jitter

```javascript
const api = createLuminara({
  hedging: {
    policy: 'race',
    hedgeDelay: 500,
    maxHedges: 3,
    exponentialBackoff: true,
    backoffMultiplier: 2,        // 500ms, 1000ms, 2000ms
    jitter: true,
    jitterRange: 0.3             // ±30% randomization
  }
});
```

**Hedge timing:**
- Hedge 1: 500ms ± 150ms (350-650ms)
- Hedge 2: 1000ms ± 300ms (700-1300ms)
- Hedge 3: 2000ms ± 600ms (1400-2600ms)

### Per-Request Configuration

Override hedging for specific requests:

```javascript
// Disable hedging for this request
await api.get('/critical', {
  hedging: false
});

// Custom hedging for this request
await api.get('/api/search', {
  hedging: {
    policy: 'race',
    hedgeDelay: 300,
    maxHedges: 3
  }
});
```

### HTTP Method Whitelist

By default, only safe/idempotent methods are hedged:

```javascript
// Default whitelist
allowedMethods: ['GET', 'HEAD', 'OPTIONS']

// Custom whitelist (use with caution)
const api = createLuminara({
  hedging: {
    policy: 'cancel-and-retry',
    allowedMethods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE']
  }
});
```

## Use Cases

### 1. Multi-Region Failover

```javascript
const api = createLuminara({
  hedging: {
    policy: 'race',
    hedgeDelay: 2000,
    maxHedges: 2
  }
});

// Try primary region, fallback to secondary if slow
await api.get('https://api-us-east.example.com/data');
```

### 2. Search/Autocomplete

```javascript
const searchApi = createLuminara({
  hedging: {
    policy: 'race',
    hedgeDelay: 300,     // Fast hedge for interactive UX
    maxHedges: 2
  }
});

await searchApi.get('/api/search?q=luminara');
```

### 3. Analytics/Logging (Non-Critical)

```javascript
const analyticsApi = createLuminara({
  hedging: {
    policy: 'cancel-and-retry',
    hedgeDelay: 5000,    // Longer delay, not time-sensitive
    maxHedges: 1
  }
});
```

## Best Practices

### ✅ DO

- **Use for read-only operations** - GET requests are ideal candidates
- **Tune hedgeDelay** - Balance between latency improvement and resource usage
- **Monitor hedge rate** - Track via stats system to optimize configuration
- **Use exponential backoff** - Prevents stampeding with multiple hedges
- **Add jitter** - Spreads out hedge requests across time
- **Test with realistic latency** - Measure actual improvement in your environment

### ❌ DON'T

- **Hedge non-idempotent operations** - POST/PATCH without `cancel-and-retry` risks duplicate processing
- **Set hedgeDelay too low** - Wastes resources, minimal latency improvement
- **Use unlimited maxHedges** - Can overwhelm servers
- **Ignore server capacity** - Each hedge consumes server resources
- **Forget about costs** - More requests = more API calls/bandwidth

## Performance Implications

### Resource Usage

```javascript
// Example: 1000 requests with hedging config
{
  policy: 'race',
  hedgeDelay: 1000,
  maxHedges: 2
}

// Worst case (all requests slow):
// - Requests sent: 3000 (3x original)
// - Best case (all fast): 1000 (no hedges triggered)
// - Typical: 1500-2000 (50-100% hedge rate)
```

### Latency Improvement

Real-world example from testing:

```
Without hedging:
- P50: 150ms
- P95: 800ms
- P99: 2500ms

With hedging (hedgeDelay: 500ms, maxHedges: 2):
- P50: 150ms (unchanged)
- P95: 600ms (-25%)
- P99: 900ms (-64%)
```

### Stats Tracking

Monitor hedging effectiveness:

```javascript
const stats = api.stats().hedging.get();
console.log(stats);
// {
//   totalRequests: 1000,
//   hedgedRequests: 450,
//   hedgeRate: 0.45,
//   averageHedgesPerRequest: 1.2,
//   successfulHedges: 380,
//   cancelledHedges: 70
// }
```

## Examples

### Example 1: Basic Race Policy

```javascript
import { createLuminara } from 'luminara';

const api = createLuminara({
  hedging: {
    policy: 'race',
    hedgeDelay: 1000,
    maxHedges: 2
  }
});

const response = await api.get('https://jsonplaceholder.typicode.com/posts/1');
console.log(response.data);
```

### Example 2: Server Rotation

```javascript
const servers = [
  'https://api-us-east.example.com',
  'https://api-us-west.example.com',
  'https://api-eu.example.com'
];

let serverIndex = 0;

const api = createLuminara({
  hedging: {
    policy: 'race',
    hedgeDelay: 2000,
    maxHedges: servers.length - 1
  }
});

api.use({
  name: 'server-rotation',
  onRequest(context) {
    // Rotate to next server for hedge requests
    if (context.attempt > 1) {
      serverIndex = (serverIndex + 1) % servers.length;
    }
    context.req.url = `${servers[serverIndex]}/data`;
  }
});

await api.get('/data');
```

### Example 3: Conditional Hedging

```javascript
const api = createLuminara({
  hedging: {
    policy: 'race',
    hedgeDelay: 1000,
    maxHedges: 2
  }
});

// Fast endpoint - disable hedging
await api.get('/api/cached-data', { hedging: false });

// Slow endpoint - aggressive hedging
await api.get('/api/analytics', {
  hedging: {
    hedgeDelay: 500,
    maxHedges: 3
  }
});
```

## Hedging vs Retry

| Feature | Hedging | Retry |
|---------|---------|-------|
| **Timing** | Concurrent/overlapping requests | Sequential requests |
| **Use case** | Reduce latency | Increase reliability |
| **Resource usage** | Higher (multiple concurrent) | Lower (sequential) |
| **Best for** | Tail latency optimization | Transient failures |
| **Risk** | Duplicate processing (race) | Delayed failure notification |

### Combining Hedging + Retry

```javascript
const api = createLuminara({
  // Hedging for latency
  hedging: {
    policy: 'race',
    hedgeDelay: 1000,
    maxHedges: 2
  },
  // Retry for reliability
  retry: 3,
  retryDelay: 1000,
  backoffType: 'exponential'
});

// Execution flow:
// 1. Initial request
// 2. If slow (>1s), send hedge request (hedging)
// 3. If both fail, retry with backoff (retry)
```

## See Also

- [Retry Documentation](./retry.md)
- [Backoff Strategies](./backoff-strategies.md)
- [Stats System](./stats.md)
- [Performance Benchmarks](../performance.md)

---

**📖 [Back to Features Documentation](./README.md)**
