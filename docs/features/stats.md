# Stats System

Real-time request metrics and analytics with flexible query interface.

## 📋 Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Stats Modules](#stats-modules)
- [Query Interface](#query-interface)
- [Time Windows](#time-windows)
- [Examples](#examples)
- [Best Practices](#best-practices)

## Overview

Luminara's stats system provides comprehensive real-time metrics for monitoring request performance, errors, and resource usage.

### Key Features

- **Modular Architecture** - Counter, timing, rate, retry, error tracking
- **Query Interface** - Flexible metric queries with filters
- **Time Windows** - Rolling60s, sinceStart, sinceReset
- **Zero Overhead** - Disabled by default, opt-in per client
- **Type-Safe API** - Full IntelliSense support

## Getting Started

### Enable Stats

```javascript
import { createLuminara } from 'luminara';

const api = createLuminara({
  statsEnabled: true  // Enable stats collection
});
```

### Access Stats

```javascript
// Get full stats snapshot
const stats = api.stats();

// Query specific metrics
const errorRate = api.query()
  .metric('errors')
  .window('rolling60s')
  .get();
```

## Stats Modules

### 1. Counter Module

Tracks request counts by status and method.

```javascript
const counterStats = api.stats().counter.get();

console.log(counterStats);
// {
//   totalRequests: 150,
//   successfulRequests: 142,
//   failedRequests: 8,
//   byStatus: {
//     200: 130,
//     201: 12,
//     404: 5,
//     500: 3
//   },
//   byMethod: {
//     GET: 100,
//     POST: 40,
//     PUT: 8,
//     DELETE: 2
//   }
// }
```

### 2. Timing Module

Tracks request duration metrics.

```javascript
const timingStats = api.stats().timing.get();

console.log(timingStats);
// {
//   averageResponseTime: 245,     // ms
//   minResponseTime: 50,
//   maxResponseTime: 1500,
//   p50: 200,                     // Median
//   p95: 800,                     // 95th percentile
//   p99: 1200                     // 99th percentile
// }
```

### 3. Rate Module

Tracks requests per second and concurrency.

```javascript
const rateStats = api.stats().rate.get();

console.log(rateStats);
// {
//   requestsPerSecond: 12.5,
//   peakRPS: 25,
//   currentConcurrency: 3,
//   peakConcurrency: 8,
//   throttledRequests: 5,
//   averageWaitTime: 120          // ms
// }
```

### 4. Retry Module

Tracks retry attempts and success rate.

```javascript
const retryStats = api.stats().retry.get();

console.log(retryStats);
// {
//   totalRetries: 42,
//   retriesByAttempt: {
//     1: 20,
//     2: 15,
//     3: 7
//   },
//   successAfterRetry: 35,
//   finalFailures: 7,
//   averageRetriesPerRequest: 1.5
// }
```

### 5. Error Module

Categorizes and tracks errors.

```javascript
const errorStats = api.stats().errors.get();

console.log(errorStats);
// {
//   totalErrors: 25,
//   byType: {
//     NetworkError: 10,
//     TimeoutError: 8,
//     HttpError: 7
//   },
//   byStatusCode: {
//     404: 5,
//     500: 3,
//     503: 2
//   },
//   mostCommonError: 'NetworkError',
//   errorRate: 0.05               // 5% error rate
// }
```

## Query Interface

### Basic Query

```javascript
const result = api.query()
  .metric('timing')           // Select metric module
  .window('rolling60s')       // Select time window
  .get();

console.log(result.averageResponseTime);
```

### Filter by Method

```javascript
const getStats = api.query()
  .metric('counter')
  .filter({ method: 'GET' })
  .get();

console.log(getStats.totalRequests);
```

### Filter by Status

```javascript
const errorStats = api.query()
  .metric('counter')
  .filter({ status: [400, 404, 500] })
  .get();

console.log(errorStats.totalRequests);
```

### Filter by Time Range

```javascript
const recentStats = api.query()
  .metric('timing')
  .filter({ 
    startTime: Date.now() - 60000,  // Last 60 seconds
    endTime: Date.now()
  })
  .get();
```

### Aggregate Multiple Metrics

```javascript
const summary = api.query()
  .metric(['counter', 'timing', 'errors'])
  .window('sinceStart')
  .get();

console.log(summary);
// {
//   counter: { ... },
//   timing: { ... },
//   errors: { ... }
// }
```

## Time Windows

### Rolling60s (Default)

Last 60 seconds of data:

```javascript
const rolling = api.query()
  .metric('rate')
  .window('rolling60s')
  .get();
```

### Since Start

All data since client creation:

```javascript
const lifetime = api.query()
  .metric('counter')
  .window('sinceStart')
  .get();
```

### Since Reset

Data since last manual reset:

```javascript
// Reset stats
api.stats().reset();

// Make requests...
await api.get('/api/data');

// Query since reset
const sinceReset = api.query()
  .metric('timing')
  .window('sinceReset')
  .get();
```

## Examples

### Example 1: Basic Stats Monitoring

```javascript
const api = createLuminara({
  statsEnabled: true
});

// Make requests
await Promise.all([
  api.get('https://jsonplaceholder.typicode.com/posts/1'),
  api.get('https://jsonplaceholder.typicode.com/posts/2'),
  api.post('https://jsonplaceholder.typicode.com/posts', { title: 'Test' })
]);

// Get snapshot
const stats = api.stats();
console.log(`Total requests: ${stats.counter.get().totalRequests}`);
console.log(`Average time: ${stats.timing.get().averageResponseTime}ms`);
```

### Example 2: Performance Dashboard

```javascript
const api = createLuminara({
  statsEnabled: true
});

// Simulate traffic
setInterval(async () => {
  try {
    await api.get('https://jsonplaceholder.typicode.com/posts/1');
  } catch (error) {
    // Errors tracked automatically
  }
}, 100);

// Display dashboard every 5 seconds
setInterval(() => {
  const stats = api.stats();
  
  console.clear();
  console.log('=== Performance Dashboard ===');
  console.log(`RPS: ${stats.rate.get().requestsPerSecond.toFixed(2)}`);
  console.log(`Avg Response: ${stats.timing.get().averageResponseTime.toFixed(0)}ms`);
  console.log(`Success Rate: ${(1 - stats.errors.get().errorRate) * 100}%`);
  console.log(`Active Requests: ${stats.rate.get().currentConcurrency}`);
}, 5000);
```

### Example 3: Error Rate Monitoring

```javascript
const api = createLuminara({
  statsEnabled: true,
  retry: 3
});

// Make requests
for (let i = 0; i < 100; i++) {
  try {
    await api.get(`https://jsonplaceholder.typicode.com/posts/${i}`);
  } catch (error) {
    // Error logged automatically
  }
}

// Check error metrics
const errorStats = api.stats().errors.get();
console.log(`Total errors: ${errorStats.totalErrors}`);
console.log(`Error rate: ${(errorStats.errorRate * 100).toFixed(2)}%`);
console.log(`Most common: ${errorStats.mostCommonError}`);

// Check retry metrics
const retryStats = api.stats().retry.get();
console.log(`Total retries: ${retryStats.totalRetries}`);
console.log(`Success after retry: ${retryStats.successAfterRetry}`);
```

### Example 4: Query Interface Examples

```javascript
const api = createLuminara({ statsEnabled: true });

// Query 1: GET requests only
const getStats = api.query()
  .metric('counter')
  .filter({ method: 'GET' })
  .window('rolling60s')
  .get();

console.log(`GET requests (60s): ${getStats.totalRequests}`);

// Query 2: Error status codes
const errorStats = api.query()
  .metric('counter')
  .filter({ status: [400, 404, 500, 503] })
  .get();

console.log(`Error responses: ${errorStats.totalRequests}`);

// Query 3: Recent performance
const recentPerf = api.query()
  .metric('timing')
  .filter({
    startTime: Date.now() - 30000,  // Last 30s
    endTime: Date.now()
  })
  .get();

console.log(`Recent avg: ${recentPerf.averageResponseTime}ms`);

// Query 4: Multi-metric summary
const summary = api.query()
  .metric(['counter', 'timing', 'errors'])
  .window('sinceStart')
  .get();

console.log('Full Summary:', summary);
```

### Example 5: Custom Monitoring with Interceptors

```javascript
const api = createLuminara({
  statsEnabled: true
});

api.use({
  name: 'performance-monitor',
  onResponse(context) {
    const stats = context.statsHub.query()
      .metric('timing')
      .window('rolling60s')
      .get();
    
    if (stats.averageResponseTime > 1000) {
      console.warn('⚠️ High latency detected:', stats.averageResponseTime);
    }
    
    return context.res;
  }
});
```

### Example 6: Reset and Compare

```javascript
const api = createLuminara({ statsEnabled: true });

// Baseline measurement
await Promise.all(
  Array.from({ length: 50 }, () =>
    api.get('https://jsonplaceholder.typicode.com/posts/1')
  )
);

const baseline = api.stats().timing.get().averageResponseTime;
console.log(`Baseline: ${baseline}ms`);

// Reset stats
api.stats().reset();

// New measurement
await Promise.all(
  Array.from({ length: 50 }, () =>
    api.get('https://jsonplaceholder.typicode.com/posts/1')
  )
);

const afterReset = api.stats().timing.get().averageResponseTime;
console.log(`After reset: ${afterReset}ms`);
console.log(`Difference: ${afterReset - baseline}ms`);
```

## Best Practices

### ✅ DO

- **Enable for monitoring** - Use stats in development and production monitoring
- **Query specific metrics** - Use query interface for targeted data
- **Reset for benchmarks** - Reset stats before performance tests
- **Monitor error rates** - Track errors to identify issues early
- **Use time windows** - Choose appropriate window for your use case

### ❌ DON'T

- **Leave enabled everywhere** - Disable stats when not needed (small overhead)
- **Poll too frequently** - Stats updates are real-time, query every 1-5 seconds
- **Ignore percentiles** - P95/P99 reveal tail latency issues
- **Forget to reset** - Reset stats between test runs for accurate comparisons

## Performance Impact

Stats collection has minimal overhead:

- **Memory**: ~50KB per 10,000 requests
- **CPU**: <0.1ms per request
- **Recommendation**: Enable in development and production monitoring

## See Also

- [Retry System](./retry.md)
- [Error Handling](./error-handling.md)
- [Rate Limiting](./rate-limiting.md)
- [Interceptors](./interceptors.md)

---

**📖 [Back to Features Documentation](./README.md)**
