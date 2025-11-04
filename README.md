# 🌌 Luminara

**Luminara** is a lightweight, framework-agnostic HTTP client built on native fetch.  
Like light traveling through space, Luminara guides your HTTP requests with grace, reliability, and cosmic precision across all modern JavaScript frameworks and vanilla applications. ✨

🌐 **Universal Compatibility**: Works seamlessly with React, Vue, Angular, Svelte, vanilla JavaScript, and any modern browser environment.

---

## ✨ Features

- ⚡ Built on modern native `fetch` (with optional ofetch driver support)
- 🌐 **Framework-agnostic** - Works with React, Vue, Angular, Svelte, and vanilla JS
- 🏗️ **Domain-driven architecture** - Feature-based modular structure
- 📊 **Comprehensive stats system** - Real-time metrics, analytics, and query interface
- 🔄 **Dual export support** - ESM/CJS compatibility with auto-detection
- 🔌 **Enhanced interceptor architecture** - Deterministic order, mutable context, retry-aware
- 🔄 **Comprehensive retry system** - 6 backoff strategies (exponential, fibonacci, jitter, etc.)
- 📝 **Verbose logging system** - Detailed debugging and request tracing
- 🎯 **Response type handling** - JSON, text, form data, binary support
- ⏱️ **Configurable timeouts** - Request timeouts and abort controller support
- 🛡️ **Robust error handling** - Comprehensive error categorization and handling
- 💎 **Ultra-compact footprint** (~12KB minified, ~4KB gzipped)
- 🪶 **Zero dependencies** (ofetch optional)
- 🎯 **Fully promise-based** with TypeScript support
- 🚗 **Pluggable driver architecture** (native fetch, ofetch, custom)
- 🌍 **Universal browser compatibility** - Chrome, Firefox, Safari, Edge

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

**React, Vue, Angular, Svelte, etc.**
```javascript
import { createLuminara } from 'luminara';
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
```

### Configuration

```js
const api = createLuminara({
  baseURL: "https://api.example.com",
  timeout: 10000,
  retry: 3,
  retryDelay: 1000,
  headers: {
    "Authorization": "Bearer YOUR_TOKEN"
  }
});
```

---

## � Exports & Advanced Usage

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
  NativeFetchDriver, 
  OfetchDriver 
} from "luminara";

// Use native fetch driver
const nativeDriver = NativeFetchDriver({
  timeout: 10000,
  retry: 5
});
const api = new LuminaraClient(nativeDriver);

// Or use ofetch driver (optional)
const ofetchDriver = OfetchDriver({
  timeout: 10000,
  retry: 5
});
const apiWithOfetch = new LuminaraClient(ofetchDriver);
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
  DEFAULT_RETRY_STATUS_CODES
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
# Required before testing sandbox/examples
npm run build        # Production build
npm run dev          # Development with watch mode
```

---

## �🔄 Retry & Backoff Strategies

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
- **30+ Interactive Examples** across 11 feature categories
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
7. �️ **Error Handling** - Comprehensive error scenarios
8. 🎯 **Response Types** - JSON, text, form, binary data handling
9. 📊 **Stats System** - Real-time metrics and analytics
10. 📝 **Verbose Logging** - Detailed debugging and tracing
11. 🚗 **Custom Drivers** - Replace the HTTP backend

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

### Runtime Requirements
- **Browser Environment Only** - Not for server-side/Node.js use
- Modern `fetch` API support
- ES2020+ JavaScript features
- ES Modules support

---

### Build System
- **Dual Exports**: Automatic ESM/CJS format support
- **Auto-Build**: `npm run build` or `npm run dev` (watch mode)
- **TypeScript Support**: Generated type definitions
- **Universal Compatibility**: Works across all JavaScript environments

---

## 📚 Documentation

- **[Sandbox Guide](./sandbox/README.md)** - Interactive examples and usage
- **[Command Line Tests Guide](./test-cli/README.md)** - Cli test usage

---

## 🧠 License

MIT © 2025 [Jonathan Miller](mailto:jonathan@miller28.com) • [LinkedIn](https://www.linkedin.com/in/miller28/)

Optional compatibility with [ofetch](https://github.com/unjs/ofetch) (MIT License)

---

## 🪐 Philosophy

**Luminara** — derived from "lumen" (light) — symbolizes clarity and adaptability.

Like light traveling through space, Luminara guides your HTTP requests with grace, reliability, and cosmic precision across all JavaScript environments. Built with mindfulness for developers who craft with intention.

**Framework-Agnostic** • **Simple by Design** • **Separation of Concerns** • **Developer-Friendly** • **Extensible**

✨ *May your requests flow like starlight across any framework*