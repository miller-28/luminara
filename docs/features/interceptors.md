# Interceptors

Enhanced interceptor architecture with deterministic execution order, mutable context, and retry-awareness.

## 📋 Table of Contents

- [Overview](#overview)
- [Basic Usage](#basic-usage)
- [Execution Order](#execution-order)
- [Context Object](#context-object)
- [Interceptor Types](#interceptor-types)
- [Advanced Patterns](#advanced-patterns)
- [Examples](#examples)

## Overview

Interceptors allow you to intercept and modify requests and responses throughout the HTTP lifecycle.

### Key Features

- **Deterministic Order** - Guaranteed L→R for requests, R→L for responses
- **Mutable Context** - Modify request/response objects directly
- **Retry-Aware** - Interceptors re-execute on retry attempts
- **Method Chaining** - Fluent API for adding multiple interceptors
- **Error Handling** - Intercept and transform errors

## Basic Usage

```javascript
import { createLuminara } from 'luminara';

const api = createLuminara();

api.use({
  name: 'auth-interceptor',
  onRequest(context) {
    context.req.headers['Authorization'] = `Bearer ${token}`;
  },
  onResponse(context) {
    console.log('Response received:', context.res.status);
    return context.res;
  },
  onResponseError(context) {
    console.error('Request failed:', context.error.message);
    throw context.error;
  }
});
```

## Execution Order

Interceptors follow a deterministic execution order:

### Request Phase (L→R)

```javascript
api.use({ name: 'A', onRequest: () => console.log('A') });
api.use({ name: 'B', onRequest: () => console.log('B') });
api.use({ name: 'C', onRequest: () => console.log('C') });

await api.get('/api/data');
// Output: A, B, C
```

### Response Phase (R→L)

```javascript
api.use({ name: 'A', onResponse: () => console.log('A') });
api.use({ name: 'B', onResponse: () => console.log('B') });
api.use({ name: 'C', onResponse: () => console.log('C') });

await api.get('/api/data');
// Output: C, B, A
```

### Complete Flow

```
Request:  A → B → C → [HTTP] → C → B → A  :Response
```

## Context Object

The context object contains complete request/response state:

```javascript
{
  req: {
    url: string,
    method: string,
    headers: Record<string, string>,
    body: any,
    signal: AbortSignal,
    ...options
  },
  res: {
    data: any,
    status: number,
    statusText: string,
    headers: Headers,
    ok: boolean
  } | null,
  error: Error | null,
  attempt: number,           // Current retry attempt
  maxRetries: number,        // Max retry attempts
  statsHub: StatsHub,        // Access to stats
  meta: Record<string, any>  // Shared metadata
}
```

## Interceptor Types

### 1. Request Interceptor

Modify outgoing requests:

```javascript
api.use({
  name: 'add-timestamp',
  onRequest(context) {
    context.req.headers['X-Request-Time'] = Date.now().toString();
  }
});
```

### 2. Response Interceptor

Transform successful responses:

```javascript
api.use({
  name: 'transform-data',
  onResponse(context) {
    return {
      ...context.res,
      data: {
        ...context.res.data,
        transformed: true,
        timestamp: Date.now()
      }
    };
  }
});
```

### 3. Error Interceptor

Handle and transform errors:

```javascript
api.use({
  name: 'error-handler',
  onResponseError(context) {
    if (context.error.status === 401) {
      // Refresh token and retry
      refreshToken();
      throw context.error; // Trigger retry
    }
    return { data: null, status: 0 }; // Fallback response
  }
});
```

## Advanced Patterns

### Pattern 1: Authentication with Refresh

```javascript
let accessToken = 'initial-token';

api.use({
  name: 'auth',
  onRequest(context) {
    context.req.headers['Authorization'] = `Bearer ${accessToken}`;
  },
  onResponseError(context) {
    if (context.error.status === 401 && context.attempt === 1) {
      // Refresh token on first 401
      accessToken = refreshAccessToken();
      throw context.error; // Retry with new token
    }
  }
});
```

### Pattern 2: Request Correlation

```javascript
api.use({
  name: 'correlation',
  onRequest(context) {
    const correlationId = generateUUID();
    context.req.headers['X-Correlation-ID'] = correlationId;
    context.meta.correlationId = correlationId;
  },
  onResponse(context) {
    console.log(`Request ${context.meta.correlationId} completed in ${Date.now() - context.meta.startTime}ms`);
    return context.res;
  }
});
```

### Pattern 3: Conditional Processing

```javascript
api.use({
  name: 'conditional',
  onRequest(context) {
    // Only process POST requests
    if (context.req.method !== 'POST') return;
    
    context.req.headers['Content-Type'] = 'application/json';
  },
  onResponse(context) {
    // Only transform successful responses
    if (!context.res.ok) return context.res;
    
    return transformResponse(context.res);
  }
});
```

### Pattern 4: Retry-Aware Logging

```javascript
api.use({
  name: 'retry-logger',
  onRequest(context) {
    if (context.attempt > 1) {
      console.log(`🔄 Retry attempt ${context.attempt}/${context.maxRetries}`);
    }
  }
});
```

## Examples

### Example 1: Authentication Interceptor

```javascript
const api = createLuminara();

api.use({
  name: 'auth',
  onRequest(context) {
    const token = localStorage.getItem('auth_token');
    if (token) {
      context.req.headers['Authorization'] = `Bearer ${token}`;
    }
  },
  onResponseError(context) {
    if (context.error.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    throw context.error;
  }
});
```

### Example 2: Request/Response Logging

```javascript
api.use({
  name: 'logger',
  onRequest(context) {
    console.log(`→ ${context.req.method} ${context.req.url}`);
    context.meta.startTime = Date.now();
  },
  onResponse(context) {
    const duration = Date.now() - context.meta.startTime;
    console.log(`← ${context.res.status} (${duration}ms)`);
    return context.res;
  },
  onResponseError(context) {
    const duration = Date.now() - context.meta.startTime;
    console.error(`✗ ${context.error.message} (${duration}ms)`);
    throw context.error;
  }
});
```

### Example 3: Data Transformation

```javascript
api.use({
  name: 'camelCase',
  onResponse(context) {
    return {
      ...context.res,
      data: camelCaseKeys(context.res.data)
    };
  }
});

// Transforms snake_case to camelCase
function camelCaseKeys(obj) {
  if (Array.isArray(obj)) {
    return obj.map(camelCaseKeys);
  }
  if (obj && typeof obj === 'object') {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      acc[camelKey] = camelCaseKeys(value);
      return acc;
    }, {});
  }
  return obj;
}
```

### Example 4: Rate Limit Handling

```javascript
api.use({
  name: 'rate-limit-handler',
  onResponseError(context) {
    if (context.error.status === 429) {
      const retryAfter = context.error.headers.get('Retry-After');
      console.warn(`Rate limited. Retry after ${retryAfter}s`);
      
      // Wait and retry
      return new Promise(resolve => {
        setTimeout(() => resolve(context.res), retryAfter * 1000);
      });
    }
    throw context.error;
  }
});
```

## Multiple Interceptors

```javascript
const api = createLuminara();

// Chain multiple interceptors
api
  .use({ name: 'auth', onRequest: addAuth })
  .use({ name: 'logger', onRequest: logRequest, onResponse: logResponse })
  .use({ name: 'transform', onResponse: transformData })
  .use({ name: 'error', onResponseError: handleError });
```

## See Also

- [Stats System](./stats.md)
- [Retry System](./retry.md)
- [Verbose Logging](./verbose-logging.md)

---

**📖 [Back to Features Documentation](./README.md)**
