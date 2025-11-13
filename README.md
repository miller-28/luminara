# 🌌 Luminara

**Luminara** is a modern, universal HTTP client built on native fetch, engineered for developers and teams who demand reliability, scalability, and architectural clarity.
It provides full lifecycle control over HTTP requests — from orchestration and interception to retries, deduplication, and analytics — all with zero external dependencies.

Lightweight by design yet powerful in scope, Luminara enables consistent, predictable network behavior across all environments — browsers (React, Vue, Angular, Svelte, vanilla JS) and Node.js 18+.
Its domain-driven architecture and type-safe foundation make it ideal for enterprise-grade applications that need transparent debugging, real-time visibility, and extendable control over every request.

[![Website](https://img.shields.io/badge/Website-luminara.website-blue?style=flat-square&logo=safari)](https://luminara.website)
[![GitHub](https://img.shields.io/badge/GitHub-miller--28%2Fluminara-black?style=flat-square&logo=github)](https://github.com/miller-28/luminara)
[![npm](https://img.shields.io/npm/v/luminara?style=flat-square&logo=npm)](https://www.npmjs.com/package/luminara)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](./LICENSE)

## ✨ Features

### Core Architecture
- ⚡ Built on modern native `fetch` - Zero external dependencies
- 🌐 **Universal compatibility** - Browsers + Node.js 18+ with native fetch
- 🏗️ **Framework-agnostic** - Works with React, Vue, Angular, Svelte, vanilla JS, and Node.js
- 🏗️ **Domain-driven architecture** - Feature-based modular structure
- 📦 **Dual export support** - ESM/CJS compatibility with auto-detection
- 🚗 **Extensible driver architecture** - Custom drivers via forking
- 💎 **Ultra-compact footprint**
- 🪶 **Zero dependencies** - Truly standalone
- 🔄 **Same API everywhere** - Identical behavior in all environments

### Request Lifecycle (Orchestration Layer)
- 🔌 **Enhanced interceptor architecture** - Deterministic order, mutable context, retry-aware
- 📊 **Comprehensive stats system** - Real-time metrics, analytics, and query interface
- 📝 **Verbose logging system** - Detailed debugging and request tracing

### Pre-Flight Features (Request Dispatcher - Phase 1)
- 🔄 **Request deduplication** - Automatic in-flight duplicate request prevention
- ⏱️ **Request debouncing** - Intelligent request delay with automatic cancellation
- 🚦 **Advanced rate limiting** - Token bucket algorithm with global, domain, and endpoint scoping

### In-Flight Features (Request Execution - Phase 2)
- ⏱️ **Configurable timeouts** - Request timeouts and abort controller support
- 🔄 **Comprehensive retry system** - 6 backoff strategies (exponential, fibonacci, jitter, etc.)

### Post-Flight Features (Response Handlers - Phase 3)
- 🎯 **Response type handling** - JSON, text, form data, binary support
- 🛡️ **Robust error handling** - Comprehensive error categorization and handling

### Developer Experience
- 🎯 **Fully promise-based** with TypeScript support

---

## 📦 Installation

### NPM/Yarn (All Frameworks)
```bash
# npm
npm install luminara

# yarn
yarn add luminara

# pnpm
pnpm add luminara
```

### CDN (Vanilla JavaScript)
```html
<!-- ES Modules via CDN -->
<script type="module">
  import { createLuminara } from 'https://cdn.skypack.dev/luminara';
  // Your code here
</script>
```

### Framework-Specific Imports

**React, Vue, Angular, Svelte (Browser)**
```javascript
import { createLuminara } from 'luminara';
```

**Node.js (ESM)**
```javascript
import { createLuminara } from 'luminara';

const api = createLuminara({
  baseURL: 'https://api.example.com',
  retry: 3,
  timeout: 5000
});

const data = await api.getJson('/users');
console.log(data);
```

**Node.js (CommonJS)**
```javascript
const { createLuminara } = require('luminara');

const api = createLuminara({
  baseURL: 'https://api.example.com'
});

api.getJson('/users')
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

**Vanilla JavaScript (Browser)**
```javascript
import { createLuminara } from 'luminara';
```

---

## 🚀 Quick Start

### Basic Usage

```js
import { createLuminara } from "luminara";

const api = createLuminara();

// GET JSON
const response = await api.getJson("https://api.example.com/users");
console.log(response.data);

// POST JSON
await api.postJson("https://api.example.com/posts", {
  title: "Hello Luminara",
  content: "A beautiful HTTP client"
});

// GET Text
const textResponse = await api.getText("https://example.com");

// POST Form Data
await api.postForm("https://api.example.com/upload", {
  name: "John",
  email: "john@example.com"
});

// PUT/PATCH with JSON
await api.putJson("https://api.example.com/users/1", { name: "Updated" });
await api.patchJson("https://api.example.com/users/1", { email: "new@example.com" });

// GET XML/HTML/Binary
const xmlResponse = await api.getXml("https://api.example.com/feed.xml");
const htmlResponse = await api.getHtml("https://example.com");
const blobResponse = await api.getBlob("https://api.example.com/file.pdf");
const bufferResponse = await api.getArrayBuffer("https://api.example.com/data.bin");

// NDJSON (Newline Delimited JSON)
const ndjsonResponse = await api.getNDJSON("https://api.example.com/stream");

// Multipart form data
const formData = new FormData();
formData.append('file', fileBlob);
await api.postMultipart("https://api.example.com/upload", formData);

// SOAP requests
await api.postSoap("https://api.example.com/soap", xmlPayload, {
  soapVersion: '1.1' // or '1.2'
});
```

### Configuration

```js
const api = createLuminara({
  baseURL: "https://api.example.com",
  timeout: 10000,
  retry: 3,
  retryDelay: 1000,
  backoffType: "exponential",
  backoffMaxDelay: 30000,
  retryStatusCodes: [408, 429, 500, 502, 503, 504],
  headers: {
    "Authorization": "Bearer YOUR_TOKEN"
  },
  verbose: true,                // Enable detailed logging
  statsEnabled: true,           // Enable request statistics (default: true)
  ignoreResponseError: false,   // Throw on HTTP errors (default: false)
  responseType: "auto",         // Auto-detect response type
  query: {                      // Default query parameters
    "api_version": "v1"
  }
});
```

### Rate Limiting

Luminara includes advanced rate limiting with token bucket algorithm and flexible scoping:

```js
const api = createLuminara({
  baseURL: "https://api.example.com",
  rateLimit: {
    rps: 10,                   // 10 requests per second
    burst: 20,                 // Allow burst of 20 requests
    scope: 'domain'            // Rate limit per domain
  }
});

// Different scoping options
const globalLimiter = createLuminara({
  rateLimit: {
    rps: 100,
    scope: 'global'            // Single rate limit across all requests
  }
});

const endpointLimiter = createLuminara({
  rateLimit: {
    rps: 5,
    scope: 'endpoint',         // Rate limit per unique endpoint
    include: ['/api/users/*'], // Only apply to specific patterns
    exclude: ['/api/health']   // Exclude certain endpoints
  }
});

// Get rate limiting stats
const rateLimitStats = api.getRateLimitStats();
console.log(rateLimitStats);

// Reset rate limiting stats
api.resetRateLimitStats();
```

---

## 📤 Exports & Advanced Usage

Luminara provides multiple export options for different use cases:

### Simple Factory (Recommended)
```js
import { createLuminara } from "luminara";

// Creates client with NativeFetchDriver by default
const api = createLuminara({
  baseURL: "https://api.example.com",
  retry: 3,
  backoffType: "exponential"
});
```

### Direct Client & Driver Access
```js
import { 
  LuminaraClient, 
  NativeFetchDriver
} from "luminara";

// Use native fetch driver (default and only driver)
const driver = NativeFetchDriver({
  timeout: 10000,
  retry: 5
});
const api = new LuminaraClient(driver);
```

### Feature Utilities & Constants
```js
import { 
  backoffStrategies,
  createBackoffHandler,
  defaultRetryPolicy,
  createRetryPolicy,
  parseRetryAfter,
  isIdempotentMethod,
  IDEMPOTENT_METHODS,
  DEFAULT_RETRY_STATUS_CODES,
  StatsHub,
  METRIC_TYPES,
  GROUP_BY_DIMENSIONS,
  TIME_WINDOWS
} from "luminara";

// Use backoff strategies directly
const exponentialDelay = backoffStrategies.exponential(3, 1000); // 4000ms

// Create custom retry policy
const customPolicy = createRetryPolicy({
  maxRetries: 5,
  statusCodes: [408, 429, 500, 502, 503],
  methods: ['GET', 'POST', 'PUT']
});

// Check if method is idempotent
if (isIdempotentMethod('GET')) {
  console.log('Safe to retry GET requests');
}

// Create standalone stats instance
const stats = new StatsHub();
```

### Build System Support
Luminara supports both ESM and CommonJS with automatic format detection:

```js
// ES Modules (modern bundlers, browsers)
import { createLuminara } from "luminara";

// CommonJS (legacy environments)
const { createLuminara } = require("luminara");
```

**Build Requirements for Development:**
```bash
# Required before testing sandbox/examples - generates dist files
npm run build        # Production build
npm run dev          # Development with watch mode
npm run build:watch  # Alternative watch mode command
```

**Note:** The dist files (`dist/index.mjs` and `dist/index.cjs`) are generated during build and required for the package to work properly. Always run `npm run build` after making changes to `src/` files.

---

## 🔄 Retry & Backoff Strategies

Luminara includes 6 built-in backoff strategies for intelligent retry handling:

### Linear Backoff
Fixed delay between retries.

```js
const api = createLuminara({
  retry: 5,
  retryDelay: 1000,
  backoffType: 'linear'
});
```

### Exponential Backoff
Delays grow exponentially (base × 2^n).

```js
const api = createLuminara({
  retry: 5,
  retryDelay: 200,
  backoffType: 'exponential'
});
// Delays: 200ms, 400ms, 800ms, 1600ms, 3200ms
```

### Exponential Capped
Exponential growth with a maximum delay cap.

```js
const api = createLuminara({
  retry: 5,
  retryDelay: 300,
  backoffType: 'exponentialCapped',
  backoffMaxDelay: 3000
});
```

### Fibonacci Backoff
Delays follow the Fibonacci sequence.

```js
const api = createLuminara({
  retry: 8,
  retryDelay: 200,
  backoffType: 'fibonacci'
});
// Delays: 200ms, 200ms, 400ms, 600ms, 1000ms, 1600ms...
```

### Jitter Backoff
Randomized delays to prevent thundering herd.

```js
const api = createLuminara({
  retry: 3,
  retryDelay: 500,
  backoffType: 'jitter'
});
```

### Exponential Jitter
Combines exponential growth with randomization.

```js
const api = createLuminara({
  retry: 4,
  retryDelay: 300,
  backoffType: 'exponentialJitter',
  backoffMaxDelay: 5000
});
```

### Custom Retry Handler

For full control, provide a custom retry function:

```js
const api = createLuminara({
  retry: 4,
  retryDelay: (context) => {
    const attempt = context.options.retry || 0;
    console.log(`Retry attempt ${attempt}`);
    return 150; // Custom delay in milliseconds
  }
});
```

### Retry on Specific Status Codes

```js
const api = createLuminara({
  retry: 3,
  retryDelay: 500,
  retryStatusCodes: [408, 429, 500, 502, 503]
});
```

---

## 🚦 Rate Limiting

Luminara's rate limiting system uses a **token bucket algorithm** with flexible scoping to control request flow and prevent API abuse.

### Token Bucket Algorithm

The rate limiter maintains token buckets that refill at a steady rate:

```js
const api = createLuminara({
  rateLimit: {
    rps: 10,  // Refill rate: 10 tokens per second
    burst: 20           // Bucket capacity: 20 tokens max
  }
});

// Allows bursts of 20 requests, then sustained 10 req/sec
await api.getJson('/api/data');  // Uses 1 token
```

### Scoping Strategies

Control rate limiting granularity with different scoping options:

#### Global Scoping
Single rate limit across all requests:
```js
const api = createLuminara({
  rateLimit: {
    rps: 100,
    scope: 'global'  // One bucket for everything
  }
});
```

#### Domain Scoping
Separate rate limits per domain:
```js
const api = createLuminara({
  rateLimit: {
    rps: 50,
    scope: 'domain'  // api.example.com vs api2.example.com
  }
});
```

#### Endpoint Scoping
Individual rate limits per unique endpoint:
```js
const api = createLuminara({
  rateLimit: {
    rps: 5,
    scope: 'endpoint'  // /api/users vs /api/posts
  }
});
```

### Pattern Matching

Fine-tune rate limiting with include/exclude patterns:

```js
const api = createLuminara({
  rateLimit: {
    rps: 10,
    scope: 'endpoint',
    include: [
      '/api/users/*',     // Rate limit user endpoints
      '/api/posts/*'      // Rate limit post endpoints
    ],
    exclude: [
      '/api/health',      // Exclude health checks
      '/api/status'       // Exclude status checks
    ]
  }
});
```

### Real-time Statistics

Monitor rate limiting performance:

```js
const api = createLuminara({
  rateLimit: { rps: 10, burst: 20 }
});

// Get current statistics
const stats = api.stats.query()
  .select(['totalRequests', 'rateLimitedRequests', 'averageWaitTime'])
  .get();

console.log('Rate limit stats:', stats);
```

### Dynamic Configuration

Update rate limits at runtime:

```js
// Start with conservative limits
const api = createLuminara({
  rateLimit: { rps: 5, burst: 10 }
});

// Increase limits based on server capacity
api.updateConfig({
  rateLimit: { rps: 20, burst: 40 }
});
```

### Error Handling

Rate limiting integrates seamlessly with Luminara's error system:

```js
try {
  await api.getJson('/api/data');
} catch (error) {
  if (error.type === 'RATE_LIMITED') {
    console.log(`Rate limited. Retry after: ${error.retryAfter}ms`);
  }
}
```

---

## 🔌 Enhanced Interceptor System

Luminara's interceptor architecture provides **deterministic execution order** and **guaranteed flow control** with a mutable context object that travels through the entire request lifecycle.

### Execution Flow & Order Guarantees

```
Request → onRequest[] (L→R) → Driver → onResponse[] (R→L) → Success
                                   ↓
                               onResponseError[] (R→L) → Error
```

**Order Guarantees:**
- **onRequest**: Executes **Left→Right** (registration order)
- **onResponse**: Executes **Right→Left** (reverse registration order)  
- **onResponseError**: Executes **Right→Left** (reverse registration order)
- **On Retry**: Re-runs onRequest interceptors for fresh tokens/headers

### Mutable Context Object

Each interceptor receives a **mutable context** object:

```js
{
  req: { /* request object */ },      // Mutable request
  res: { /* response object */ },     // Mutable response (in onResponse)
  error: { /* error object */ },      // Error details (in onResponseError)
  attempt: 1,                         // Current retry attempt number
  controller: AbortController,        // Request abort controller
  meta: {}                           // Custom metadata storage
}
```

### Request Interceptor

Modify requests with guaranteed **Left→Right** execution:

```js
// First registered = First executed
api.use({
  onRequest(context) {
    console.log(`📤 Attempt ${context.attempt}:`, context.req.method, context.req.url);
    
    // Modify request directly
    context.req.headers = {
      ...(context.req.headers || {}),
      'X-Custom-Header': 'Luminara',
      'X-Attempt': context.attempt.toString()
    };

    // Store metadata for later interceptors
    context.meta.startTime = Date.now();
    
    // Add fresh auth token (important for retries!)
    context.req.headers['Authorization'] = `Bearer ${getFreshToken()}`;
  }
});

// Second registered = Second executed
api.use({
  onRequest(context) {
    console.log('🔐 Adding security headers...');
    context.req.headers['X-Request-ID'] = generateRequestId();
  }
});
```

### Response Interceptor

Transform responses with guaranteed **Right→Left** execution:

```js
// First registered = LAST executed (reverse order)
api.use({
  onResponse(context) {
    console.log('📥 Processing response:', context.res.status);
    
    // Transform response data
    context.res.data = {
      ...context.res.data,
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - context.meta.startTime,
      attempt: context.attempt
    };
  }
});

// Second registered = FIRST executed (reverse order)
api.use({
  onResponse(context) {
    console.log('✅ Response received, validating...');
    
    // Validate response structure
    if (!context.res.data || typeof context.res.data !== 'object') {
      throw new Error('Invalid response format');
    }
  }
});
```

### Error Handler

Handle errors with guaranteed **Right→Left** execution:

```js
api.use({
  onResponseError(context) {
    console.error(`❌ Request failed (attempt ${context.attempt}):`, context.req.url);
    console.error('Error:', context.error.message);
    
    // Log error details
    context.meta.errorLogged = true;
    
    // Modify error before it propagates
    if (context.error.status === 401) {
      context.error.message = 'Authentication failed - please refresh your session';
    }
  }
});
```

### Retry-Aware Authentication

The enhanced system re-runs **onRequest** interceptors on retry, perfect for refreshing tokens:

```js
api.use({
  onRequest(context) {
    // This runs EVERY attempt, ensuring fresh tokens
    const token = context.attempt === 1 
      ? getCachedToken() 
      : await refreshToken(); // Fresh token on retry
      
    context.req.headers['Authorization'] = `Bearer ${token}`;
    
    console.log(`🔑 Attempt ${context.attempt}: Using ${context.attempt === 1 ? 'cached' : 'fresh'} token`);
  }
});
```

### Complex Multi-Interceptor Example

Demonstrates guaranteed execution order and context sharing:

```js
// Interceptor 1: Authentication (runs FIRST on request, LAST on response)
api.use({
  onRequest(context) {
    console.log('1️⃣ [Auth] Adding authentication...');
    context.req.headers['Authorization'] = `Bearer ${getToken()}`;
    context.meta.authAdded = true;
  },
  onResponse(context) {
    console.log('1️⃣ [Auth] Validating auth response... (LAST)');
    if (context.res.status === 401) {
      invalidateToken();
    }
  },
  onResponseError(context) {
    console.log('1️⃣ [Auth] Handling auth error... (LAST)');
    if (context.error.status === 401) {
      context.meta.authFailed = true;
    }
  }
});

// Interceptor 2: Logging (runs SECOND on request, MIDDLE on response)
api.use({
  onRequest(context) {
    console.log('2️⃣ [Log] Request started...');
    context.meta.startTime = performance.now();
  },
  onResponse(context) {
    console.log('2️⃣ [Log] Request completed (MIDDLE)');
    const duration = performance.now() - context.meta.startTime;
    console.log(`Duration: ${duration.toFixed(2)}ms`);
  },
  onResponseError(context) {
    console.log('2️⃣ [Log] Request failed (MIDDLE)');
    const duration = performance.now() - context.meta.startTime;
    console.log(`Failed after: ${duration.toFixed(2)}ms`);
  }
});

// Interceptor 3: Analytics (runs THIRD on request, FIRST on response)
api.use({
  onRequest(context) {
    console.log('3️⃣ [Analytics] Tracking request... (LAST)');
    analytics.trackRequestStart(context.req.url);
  },
  onResponse(context) {
    console.log('3️⃣ [Analytics] Tracking success... (FIRST)');
    analytics.trackRequestSuccess(context.req.url, context.res.status);
  },
  onResponseError(context) {
    console.log('3️⃣ [Analytics] Tracking error... (FIRST)');
    analytics.trackRequestError(context.req.url, context.error);
  }
});

/*
Execution Order:
Request: 1️⃣ Auth → 2️⃣ Log → 3️⃣ Analytics → HTTP Request
Response: 3️⃣ Analytics → 2️⃣ Log → 1️⃣ Auth
Error: 3️⃣ Analytics → 2️⃣ Log → 1️⃣ Auth
*/
```

### Abort Controller Access

Every request gets an AbortController accessible via context:

```js
api.use({
  onRequest(context) {
    // Cancel request after 5 seconds
    setTimeout(() => {
      console.log('⏰ Request taking too long, aborting...');
      context.controller.abort();
    }, 5000);
  },
  onResponseError(context) {
    if (context.error.name === 'AbortError') {
      console.log('🚫 Request was aborted');
    }
  }
});
```

---

## ⏱️ Timeout & Abort

### Configure Timeout

```js
const api = createLuminara({
  timeout: 5000 // 5 seconds
});

// Will throw timeout error if request takes longer than 5s
await api.get('https://slow-api.example.com/data');
```

### Manual Abort with AbortController

```js
const controller = new AbortController();

// Start request
const promise = api.get('https://api.example.com/long-task', {
  signal: controller.signal
});

// Abort after 2 seconds
setTimeout(() => controller.abort(), 2000);

try {
  await promise;
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Request was cancelled');
  }
}
```

---

## 🚗 Custom Drivers

Replace the default native fetch driver with your own implementation:

```js
import { LuminaraClient } from "luminara";

const customDriver = () => ({
  async request(options) {
    const { url, method = 'GET', headers, body, signal } = options;
    
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal
    });
    
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();
    
    return {
      status: response.status,
      headers: response.headers,
      data
    };
  }
});

const api = new LuminaraClient(customDriver());
```

---

## 📊 Stats System

Luminara includes a **comprehensive statistics system** that tracks request metrics, performance data, and analytics in real-time. Perfect for monitoring application health and request patterns.

### Basic Stats Usage

```js
const api = createLuminara({
  baseURL: "https://api.example.com",
  statsEnabled: true // enabled by default
});

// Make some requests
await api.getJson('/users');
await api.postJson('/posts', { title: 'Hello' });

// Get basic counters
const counters = api.stats().counters.get();
console.log(counters);
// { total: 2, success: 2, fail: 0, inflight: 0, retried: 0, aborted: 0 }

// Get performance metrics
const timeMetrics = api.stats().time.get();
console.log(timeMetrics);
// { minMs: 150, avgMs: 275, p50Ms: 200, p95Ms: 350, p99Ms: 350, maxMs: 400 }
```

### Advanced Query Interface

The stats system provides a powerful query interface for detailed analytics:

```js
// Query stats by endpoint
const endpointStats = api.stats().query({
  metrics: ['counters', 'time', 'rate'],
  groupBy: 'endpoint',
  window: 'since-reset',
  limit: 10
});

// Query stats by domain
const domainStats = api.stats().query({
  metrics: ['counters', 'error'],
  groupBy: 'domain',
  where: { method: 'POST' }
});

// Get rate metrics (requests per second/minute)
const rateStats = api.stats().rate.get();
console.log(rateStats);
// { rps: 2.5, rpm: 150, mode: 'ema-30s' }
```

### Available Metrics

- **Counters**: `total`, `success`, `fail`, `inflight`, `retried`, `aborted`
- **Time**: `minMs`, `avgMs`, `p50Ms`, `p95Ms`, `p99Ms`, `maxMs` 
- **Rate**: `rps` (requests/sec), `rpm` (requests/min), `mode`
- **Retry**: `count`, `giveups`, `avgBackoffMs`, `successAfterAvg`
- **Error**: `byClass` (timeout, network, 4xx, 5xx), `topCodes`

### Grouping & Filtering

```js
// Group by method, filter by domain
const methodStats = api.stats().query({
  metrics: ['counters'],
  groupBy: 'method',
  where: { domain: 'api.example.com' },
  window: 'rolling-60s'
});

// Group by endpoint with filters
const filteredStats = api.stats().query({
  metrics: ['time', 'error'],
  groupBy: 'endpoint',
  where: { 
    method: 'GET',
    endpointPrefix: '/api/' 
  },
  limit: 5
});
```

### Reset & Snapshots

```js
// Reset all stats
api.stats().reset();

// Reset individual modules
api.stats().counters.reset();
api.stats().time.reset();

// Take a snapshot (all metrics, point-in-time)
const snapshot = api.stats().snapshot();
console.log(snapshot);
// { timestamp: "2025-11-04T...", window: "since-start", groups: [...] }
```

### Disable/Enable Stats

```js
// Disable stats for performance-critical apps
const api = createLuminara({
  baseURL: "https://api.example.com",
  statsEnabled: false
});

// Check if stats are enabled
console.log(api.isStatsEnabled()); // false

// When disabled, stats methods return safe defaults
const counters = api.stats().counters.get(); // Returns zero counters
```

---

## 🎨 Interactive Sandbox

Luminara includes a **beautiful interactive sandbox** where you can explore all features with live examples!

🌐 **[Try the Sandbox](./sandbox/)** • [Sandbox Documentation](./sandbox/README.md) • [Architecture Guide](./sandbox/ARCHITECTURE.md)

The sandbox features:
- **75+ Interactive Examples** across 14 feature categories
- **Live Retry Logging** - Watch backoff strategies in action
- **Individual Test Controls** - Run and stop tests independently
- **Real-time Feedback** - Color-coded outputs with detailed logs
- **Clean Architecture** - Demonstrates separation of concerns principles

### Sandbox Categories:

1. 📦 **Basic Usage** - GET/POST JSON, Text, Form data
2. 🔗 **Base URL & Query Parameters** - URL configuration  
3. ⏱️ **Timeout** - Success and failure scenarios
4. 🔄 **Retry** - Basic retry with status codes
5. 📈 **Backoff Strategies** - All 6 strategies with live visualization
6. 🔌 **Interceptors** - Request/response/error interceptors
7. 🛡️ **Error Handling** - Comprehensive error scenarios
8. 🎯 **Response Types** - JSON, text, form, binary data handling
9. 📊 **Stats System** - Real-time metrics and analytics
10. 📝 **Verbose Logging** - Detailed debugging and tracing
11. 🚗 **Custom Drivers** - Replace the HTTP backend
12. 🚦 **Rate Limiting** - Token bucket algorithm examples
13. ⏱️ **Debouncer** - Search debouncing, button spam protection, method filtering
14. � **Request Deduplicator** - Automatic duplicate prevention, key strategies, TTL

**Quick Start:**
```bash
# Run the sandbox locally
npx serve .
# Open http://localhost:3000/sandbox/
```

---

## 🌈 Framework Examples

### React
```jsx
import { useEffect, useState } from "react";
import { createLuminara } from "luminara";

const api = createLuminara({
  baseURL: "https://api.example.com",
  retry: 3,
  retryDelay: 1000,
  backoffType: "exponential"
});

// Add global error handling
api.use({
  onError(error) {
    console.error("API Error:", error.message);
  }
});

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getJson("/users")
      .then(res => {
        setUsers(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
}
```

### Vue 3 (Composition API)
```vue
<script setup>
import { ref, onMounted } from 'vue';
import { createLuminara } from 'luminara';

const api = createLuminara({
  baseURL: 'https://api.example.com',
  retry: 3,
  backoffType: 'exponential'
});

const users = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const response = await api.getJson('/users');
    users.value = response.data;
  } catch (error) {
    console.error('Failed to fetch users:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div>
    <div v-if="loading">Loading...</div>
    <ul v-else>
      <li v-for="user in users" :key="user.id">
        {{ user.name }}
      </li>
    </ul>
  </div>
</template>
```

### Angular
```typescript
import { Component, OnInit } from '@angular/core';
import { createLuminara } from 'luminara';

@Component({
  selector: 'app-users',
  template: `
    <div *ngIf="loading">Loading...</div>
    <ul *ngIf="!loading">
      <li *ngFor="let user of users">{{ user.name }}</li>
    </ul>
  `
})
export class UsersComponent implements OnInit {
  users: any[] = [];
  loading = true;
  
  private api = createLuminara({
    baseURL: 'https://api.example.com',
    retry: 3,
    backoffType: 'exponential'
  });

  async ngOnInit() {
    try {
      const response = await this.api.getJson('/users');
      this.users = response.data;
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      this.loading = false;
    }
  }
}
```

### Pure JavaScript (No Frameworks)
```html
<!DOCTYPE html>
<html>
<head>
  <title>Luminara Example</title>
</head>
<body>
  <div id="app">
    <div id="loading">Loading...</div>
    <ul id="users" style="display: none;"></ul>
  </div>

  <script type="module">
    import { createLuminara } from 'https://cdn.skypack.dev/luminara';

    const api = createLuminara({
      baseURL: 'https://api.example.com',
      retry: 3,
      backoffType: 'exponential'
    });

    async function loadUsers() {
      try {
        const response = await api.getJson('/users');
        
        const loadingEl = document.getElementById('loading');
        const usersEl = document.getElementById('users');
        
        loadingEl.style.display = 'none';
        usersEl.style.display = 'block';
        
        response.data.forEach(user => {
          const li = document.createElement('li');
          li.textContent = user.name;
          usersEl.appendChild(li);
        });
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    }

    loadUsers();
  </script>
</body>
</html>
```

---

## 🌐 Framework Compatibility

Luminara is designed to be **completely framework-agnostic** and works seamlessly across all modern JavaScript environments:

| Framework | Compatibility | Example |
|-----------|---------------|---------|
| **React** | ✅ Full Support | `useEffect(() => { api.getJson('/data') }, [])` |
| **Vue 3** | ✅ Full Support | `onMounted(() => api.getJson('/data'))` |
| **Angular** | ✅ Full Support | `ngOnInit() { api.getJson('/data') }` |
| **Svelte** | ✅ Full Support | `onMount(() => api.getJson('/data'))` |
| **Pure JavaScript** | ✅ Full Support | `api.getJson('/data').then(...)` |
| **Next.js** | ✅ Full Support | Client-side data fetching |
| **Nuxt.js** | ✅ Full Support | Client-side data fetching |
| **Vite** | ✅ Full Support | All frameworks via Vite |
| **Webpack** | ✅ Full Support | All bundled applications |

### Browser Support
- ✅ Chrome 88+
- ✅ Firefox 90+
- ✅ Safari 14+
- ✅ Edge 88+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### Node.js Support
- ✅ Node.js 18.x (LTS - Maintenance)
- ✅ Node.js 20.x (LTS - Active)
- ✅ Node.js 22.x (LTS - Current)

### Runtime Requirements
- **Universal**: Works in browsers and Node.js 18+
- Modern `fetch` API support (native in all supported environments)
- ES2020+ JavaScript features
- ES Modules support

---

### Build System
- **Dual Exports**: Automatic ESM/CJS format support
- **Auto-Build**: `npm run build` or `npm run dev` (watch mode)
- **TypeScript Support**: Generated type definitions
- **Universal Compatibility**: Works across all JavaScript environments

---

## ⚡ Performance & Benchmarks

Luminara includes a **comprehensive benchmark suite** to measure and track performance across all architectural layers — from micro-operations to full end-to-end request flows.

### Benchmark Suite Features

- **50+ Node.js Benchmarks** - High-precision measurements with memory profiling
- **30+ Browser Benchmarks** - Interactive browser-based testing with Chart.js visualizations
- **Cross-Browser Testing** - Automated headless benchmarks across Chromium, Firefox, and WebKit
- **Historical Tracking** - Performance regression detection and baseline comparison
- **Beautiful Reports** - HTML reports with charts, trends, and statistical analysis

### Performance Characteristics

| Layer | Mean Performance | Verdict |
|-------|------------------|---------|
| Core API | 4-5 µs | ⚡ Ideal (microsecond precision) |
| Plugin Orchestration | 30-45 µs | ✅ Excellent (linear scaling) |
| Driver Layer | 1-19 µs | ✅ Excellent (sync operations) |
| Network I/O | 15-50 ms | ⚙️ Network-bound (expected) |
| Integrated Scenarios | 16-180 ms | 🪶 Balanced (minimal overhead) |

### Running Benchmarks

```bash
# Node.js benchmarks (all categories)
cd benchmark
npm run benchmark

# Specific categories
npm run benchmark:core
npm run benchmark:orchestration
npm run benchmark:driver
npm run benchmark:features
npm run benchmark:integrated

# Browser benchmarks (interactive)
npm run benchmark:browser

# Headless cross-browser testing
npm run benchmark:headless        # Full suite (Chromium, Firefox, WebKit)
npm run benchmark:headless:quick  # Quick test (Chromium only)

# Reports
npm run benchmark:report      # Generate HTML report
```

### Key Findings

✅ **Near-Zero Overhead** - Core operations execute at microsecond precision  
✅ **Linear Scaling** - Plugin system adds no exponential cost  
✅ **Network Parity** - HTTP operations match native `fetch` performance  
✅ **Deterministic Timing** - Retry and backoff strategies execute with scheduler-level accuracy  
✅ **Production-Ready** - Validated across 30+ real-world scenarios

📊 **[View Detailed Performance Analysis](./docs/performance.md)**

---

## 📚 Documentation

- **[Sandbox Guide](./sandbox/README.md)** - Interactive examples and usage
- **[Command Line Tests Guide](./test-cli/README.md)** - Cli test usage
- **[Benchmark Suite Guide](./benchmark/README.md)** - Benchmark usage and configuration
- **[Performance Benchmarks](./docs/performance.md)** - Detailed performance analysis

---

## 🧠 License

MIT © 2025 [Jonathan Miller](mailto:jonathan@miller28.com) • [LinkedIn](https://www.linkedin.com/in/miller28/)

---

## 🪐 Philosophy

**Luminara** — derived from "lumen" (light) — symbolizes clarity and adaptability.

Like light traveling through space, Luminara guides your HTTP requests with grace, reliability, and cosmic precision across all JavaScript environments. Built with mindfulness for developers who craft with intention.

**Framework-Agnostic** • **Simple by Design** • **Separation of Concerns** • **Developer-Friendly** • **Extensible**
