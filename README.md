# 🌌 Luminara

**Luminara** is a lightweight, framework-agnostic HTTP client built on native fetch.  
Like light traveling through space, Luminara guides your HTTP requests with grace, reliability, and cosmic precision across all modern JavaScript frameworks and vanilla applications. ✨

🌐 **Universal Compatibility**: Works seamlessly with React, Vue, Angular, Svelte, vanilla JavaScript, and any modern browser environment.

---

## ✨ Features

- ⚡ Built on modern native `fetch` (with optional ofetch driver support)
- 🌐 **Framework-agnostic** - Works with React, Vue, Angular, Svelte, and vanilla JS
- 🏗️ **Domain-driven architecture** (v0.5.0) - Feature-based modular structure
- � **Dual export support** (v0.4.0) - ESM/CJS compatibility with auto-detection
- �🔌 Powerful plugin architecture (interceptors, transformers, error handlers)
- 🔄 Advanced retry logic with 6 backoff strategies
- ⏱️ Configurable timeouts and status code handling
- 💎 Tiny footprint (~7KB native, ~10KB with ofetch)
- 🪶 Zero dependencies (ofetch optional)
- 🎯 Fully promise-based with TypeScript support (v0.4.0)
- 🚗 Pluggable driver architecture (native fetch, ofetch, custom)
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

**Node.js (if browser APIs available)**
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

### Build System Support (v0.4.0+)
Luminara supports both ESM and CommonJS with automatic format detection:

```js
// ES Modules (modern bundlers, Node.js)
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

Luminara includes 6 built-in backoff strategies for intelligent retry logic:

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

### Migration from Legacy Plugin System

**Old System (Deprecated):**
```js
// ❌ Old way - no order guarantees
api.use({
  onRequest(request) {
    // Immutable, no context sharing
    return { ...request, headers: { ...request.headers, auth: token } };
  },
  onSuccess(response, request) {
    // Different parameter order, no context
    return { ...response, transformed: true };
  },
  onError(error, request) {
    // No context, limited error handling
    console.error(error);
  }
});
```

**New System (Enhanced):**
```js
// ✅ New way - guaranteed order, mutable context
api.use({
  onRequest(context) {
    // Mutable context, guaranteed order
    context.req.headers = { ...context.req.headers, auth: token };
  },
  onResponse(context) {
    // Consistent context object, reverse order
    context.res.data.transformed = true;
  },
  onResponseError(context) {
    // Rich context with attempt info, metadata
    console.error(`Attempt ${context.attempt}:`, context.error);
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

---

## 🎨 Interactive Sandbox

Luminara includes a **beautiful interactive sandbox** where you can explore all features with live examples!

🌐 **[Try the Sandbox](./sandbox/)** • [Sandbox Documentation](./sandbox/README.md) • [Architecture Guide](./sandbox/ARCHITECTURE.md)

The sandbox features:
- **21 Interactive Examples** across 8 feature categories
- **Live Retry Logging** - Watch backoff strategies in action
- **Individual Test Controls** - Run and stop tests independently
- **Real-time Feedback** - Color-coded outputs with detailed logs
- **Clean Architecture** - Demonstrates separation of concerns principles

### Sandbox Categories:

1. 📦 **Basic Usage** - GET/POST JSON, Text, Form data
2. 🔗 **Base URL & Query Parameters** - URL configuration
3. ⏱️ **Timeout** - Success and failure scenarios
4. 🔄 **Retry Logic** - Basic retry with status codes
5. 📈 **Backoff Strategies** - All 6 strategies with live visualization
6. ⚙️ **Custom Retry** - Custom retryDelay functions
7. 🔌 **Plugin System** - Request/response/error interceptors
8. 🚗 **Custom Drivers** - Replace the HTTP backend

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
- Modern `fetch` API support
- ES2020+ JavaScript features
- ES Modules support

---

## 🧩 Project Structure

```
luminara/
  src/                      # Source code (domain-driven architecture)
    index.js                # Main entry point and exports
    core/                   # Core client abstraction layer
      luminara.js           # LuminaraClient with plugin system
    drivers/                # HTTP driver implementations
      native/               # Native fetch driver (feature-based)
        index.js            # Main driver implementation
        features/           # Modular feature domains
          retry/            # Retry logic, backoff strategies, policies
            backoff.js      # Backoff strategy implementations
            retryPolicy.js  # Retry policies and utilities
          timeout/          # Timeout handling
          response/         # Response type processing
          error/            # Error handling utilities
          url/              # URL processing and query handling
      ofetch/               # Ofetch driver (optional)
        index.js            # Ofetch implementation
  dist/                     # Built distribution files (auto-generated)
    index.mjs               # ES Module format
    index.cjs               # CommonJS format
  types/                    # TypeScript definitions (auto-generated)
    index.d.ts              # Type definitions
  test-cli/                 # CLI test environment
    tests/                  # Comprehensive test suites
    testRunner.js           # Test orchestrator
    testUtils.js            # Testing utilities
  test-on-react-app/        # React browser test environment
    src/                    # React app with 22 comprehensive tests
  sandbox/                  # Interactive examples (21 examples)
    examples/               # Feature-based example files
    index.html              # Sandbox UI
  package.json              # Package configuration with dual exports
  tsup.config.js            # Build configuration
  README.md                 # This documentation
  RELEASE_NOTES.md          # Version history and changes
  LICENSE                   # MIT License
```

### Build System (v0.4.0+)
- **Dual Exports**: Automatic ESM/CJS format support
- **Auto-Build**: `npm run build` or `npm run dev` (watch mode)
- **TypeScript Support**: Generated type definitions
- **Universal Compatibility**: Works across all JavaScript environments

---

## 📚 Documentation

- **[Sandbox Guide](./sandbox/README.md)** - Interactive examples and usage

---

## 🛣️ Roadmap

- [x] Core HTTP methods (GET, POST, PUT, PATCH, DELETE)
- [x] **Enhanced interceptor system** (deterministic order, mutable context, retry-aware)
- [x] Plugin system (onRequest, onResponse, onResponseError)
- [x] Retry logic with configurable attempts
- [x] 6 Backoff strategies (linear, exponential, fibonacci, jitter, etc.)
- [x] Custom retry handlers
- [x] Timeout support
- [x] Retry on specific status codes
- [x] Custom driver support
- [x] Interactive sandbox with 21 examples
- [x] **Dual export support** (ESM/CJS) - v0.4.0
- [x] **Auto-build system** with watch mode - v0.4.0
- [x] **TypeScript definitions** and IntelliSense support - v0.4.0
- [x] **Domain-driven architecture** with feature-based modules - v0.5.0
- [x] **Client-driver separation** and pluggable architecture - v0.5.0
- [x] **Comprehensive export system** with utilities and constants - v0.5.0
- [ ] Request debouncer (per key)
- [ ] Rate limiter (token bucket)
- [ ] Cache adapter (localStorage/memory)
- [ ] Request tracing and metrics

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