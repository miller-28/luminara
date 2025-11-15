# Custom Drivers

Build custom HTTP backend adapters to replace the default native fetch driver.

## 📋 Table of Contents

- [Overview](#overview)
- [Driver Interface](#driver-interface)
- [Implementation Guide](#implementation-guide)
- [Examples](#examples)
- [Best Practices](#best-practices)

## Overview

Luminara's driver system allows you to replace the default native fetch implementation with custom HTTP backends (axios, node-fetch, XMLHttpRequest, etc.).

### Key Features

- **Pluggable Architecture** - Swap HTTP backends without changing application code
- **Simple Interface** - Implement one `async request()` method
- **Full Control** - Access to request/response lifecycle
- **Context Integration** - Stats, plugins, retry all work with custom drivers
- **Type Safety** - Predictable driver contract

## Driver Interface

Custom drivers must implement this interface:

```javascript
{
  async request(opts, context) {
    // opts: Request configuration
    // context: { statsHub, attempt, maxRetries, signal, ... }
    
    // Return response in Luminara format:
    return {
      data: any,              // Parsed response body
      status: number,         // HTTP status code
      statusText: string,     // Status text
      headers: Headers,       // Response headers
      config: opts,           // Request config
      request: object         // Request details
    };
  }
}
```

## Implementation Guide

### Step 1: Create Driver Function

```javascript
function MyCustomDriver(config = {}) {
  return {
    async request(opts, context) {
      // Implement HTTP logic here
    }
  };
}
```

### Step 2: Handle Request Execution

```javascript
function MyCustomDriver(config = {}) {
  return {
    async request(opts, context) {
      const url = opts.url;
      const method = opts.method || 'GET';
      const headers = opts.headers || {};
      const body = opts.body;
      
      // Execute HTTP request
      const response = await yourHttpLibrary({
        url,
        method,
        headers,
        body
      });
      
      // Return in Luminara format
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config: opts,
        request: { url, method }
      };
    }
  };
}
```

### Step 3: Use Custom Driver

```javascript
import { createLuminara } from 'luminara';

const api = createLuminara({
  driver: MyCustomDriver({
    // Driver-specific config
  })
});

// Use normally
const response = await api.get('/api/data');
```

## Examples

### Example 1: Basic Custom Driver

```javascript
function SimpleDriver() {
  return {
    async request(opts, context) {
      const url = opts.url;
      const method = opts.method || 'GET';
      
      console.log(`[SimpleDriver] ${method} ${url}`);
      
      // Use native fetch
      const response = await fetch(url, {
        method,
        headers: opts.headers,
        body: opts.body,
        signal: context.signal
      });
      
      // Parse response
      const contentType = response.headers.get('Content-Type') || '';
      let data;
      
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      // Return Luminara format
      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config: opts,
        request: { url, method }
      };
    }
  };
}

// Usage
const api = createLuminara({
  driver: SimpleDriver()
});

await api.get('https://jsonplaceholder.typicode.com/posts/1');
// Logs: [SimpleDriver] GET https://jsonplaceholder.typicode.com/posts/1
```

### Example 2: Logging Driver

```javascript
function LoggingDriver(baseDriver) {
  return {
    async request(opts, context) {
      const startTime = Date.now();
      
      console.log(`→ ${opts.method} ${opts.url}`);
      console.log(`  Headers:`, opts.headers);
      console.log(`  Body:`, opts.body);
      
      try {
        const response = await baseDriver.request(opts, context);
        const duration = Date.now() - startTime;
        
        console.log(`← ${response.status} ${response.statusText} (${duration}ms)`);
        console.log(`  Data:`, response.data);
        
        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`✗ ${error.message} (${duration}ms)`);
        throw error;
      }
    }
  };
}

// Usage (wrap existing driver)
import { NativeFetchDriver } from 'luminara/drivers/native';

const api = createLuminara({
  driver: LoggingDriver(NativeFetchDriver())
});
```

### Example 3: Mock Driver for Testing

```javascript
function MockDriver(mockResponses = {}) {
  return {
    async request(opts, context) {
      const key = `${opts.method} ${opts.url}`;
      const mockResponse = mockResponses[key];
      
      if (!mockResponse) {
        throw new Error(`No mock response for ${key}`);
      }
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, mockResponse.delay || 100));
      
      // Return mock response
      return {
        data: mockResponse.data,
        status: mockResponse.status || 200,
        statusText: mockResponse.statusText || 'OK',
        headers: new Headers(mockResponse.headers || {}),
        config: opts,
        request: { url: opts.url, method: opts.method }
      };
    }
  };
}

// Usage
const api = createLuminara({
  driver: MockDriver({
    'GET /api/users': {
      data: [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }],
      status: 200,
      delay: 50
    },
    'POST /api/users': {
      data: { id: 3, name: 'New User' },
      status: 201,
      delay: 100
    },
    'GET /api/error': {
      data: { error: 'Not Found' },
      status: 404,
      statusText: 'Not Found'
    }
  })
});

// All requests return mock data
const users = await api.get('/api/users');
console.log(users.data);  // [{ id: 1, name: 'John' }, ...]
```

### Example 4: Caching Driver

```javascript
function CachingDriver(baseDriver, ttl = 60000) {
  const cache = new Map();
  
  return {
    async request(opts, context) {
      // Only cache GET requests
      if (opts.method !== 'GET') {
        return baseDriver.request(opts, context);
      }
      
      const cacheKey = opts.url;
      const cached = cache.get(cacheKey);
      
      // Return cached response if fresh
      if (cached && Date.now() - cached.timestamp < ttl) {
        console.log(`[Cache] HIT ${opts.url}`);
        return cached.response;
      }
      
      // Execute request
      console.log(`[Cache] MISS ${opts.url}`);
      const response = await baseDriver.request(opts, context);
      
      // Cache response
      cache.set(cacheKey, {
        response,
        timestamp: Date.now()
      });
      
      return response;
    }
  };
}

// Usage
const api = createLuminara({
  driver: CachingDriver(NativeFetchDriver(), 30000)  // 30s TTL
});

// First call - cache miss
await api.get('/api/data');  // Logs: [Cache] MISS /api/data

// Second call within 30s - cache hit
await api.get('/api/data');  // Logs: [Cache] HIT /api/data
```

### Example 5: Retry Driver Wrapper

```javascript
function RetryDriver(baseDriver, maxRetries = 3, retryDelay = 1000) {
  return {
    async request(opts, context) {
      let lastError;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await baseDriver.request(opts, context);
        } catch (error) {
          lastError = error;
          
          if (attempt < maxRetries) {
            console.log(`Retry ${attempt}/${maxRetries} after ${retryDelay}ms`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      }
      
      throw lastError;
    }
  };
}

// Usage
const api = createLuminara({
  driver: RetryDriver(NativeFetchDriver(), 3, 1000)
});
```

### Example 6: Axios Driver

```javascript
import axios from 'axios';

function AxiosDriver(axiosConfig = {}) {
  const axiosInstance = axios.create(axiosConfig);
  
  return {
    async request(opts, context) {
      try {
        const response = await axiosInstance({
          url: opts.url,
          method: opts.method,
          headers: opts.headers,
          data: opts.body,
          signal: context.signal,
          timeout: opts.timeout
        });
        
        return {
          data: response.data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          config: opts,
          request: response.request
        };
      } catch (error) {
        if (error.response) {
          // HTTP error with response
          return {
            data: error.response.data,
            status: error.response.status,
            statusText: error.response.statusText,
            headers: error.response.headers,
            config: opts,
            request: error.request
          };
        }
        throw error;
      }
    }
  };
}

// Usage
const api = createLuminara({
  driver: AxiosDriver({
    baseURL: 'https://api.example.com',
    timeout: 5000
  })
});
```

### Example 7: Node.js fetch Driver

```javascript
import nodeFetch from 'node-fetch';

function NodeFetchDriver() {
  return {
    async request(opts, context) {
      const response = await nodeFetch(opts.url, {
        method: opts.method,
        headers: opts.headers,
        body: opts.body,
        signal: context.signal
      });
      
      const contentType = response.headers.get('Content-Type') || '';
      let data;
      
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config: opts,
        request: { url: opts.url, method: opts.method }
      };
    }
  };
}

// Usage in Node.js
const api = createLuminara({
  driver: NodeFetchDriver()
});
```

### Example 8: Stats-Aware Driver

```javascript
function StatsDriver(baseDriver) {
  return {
    async request(opts, context) {
      const startTime = Date.now();
      
      try {
        const response = await baseDriver.request(opts, context);
        const duration = Date.now() - startTime;
        
        // Log custom stats
        if (context.statsHub) {
          console.log(`[Stats] ${opts.method} ${opts.url} - ${duration}ms`);
        }
        
        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        if (context.statsHub) {
          console.log(`[Stats] ERROR ${opts.method} ${opts.url} - ${duration}ms`);
        }
        
        throw error;
      }
    }
  };
}

// Usage
const api = createLuminara({
  driver: StatsDriver(NativeFetchDriver()),
  statsEnabled: true
});
```

## Best Practices

### ✅ DO

- **Return correct format** - Match Luminara's response structure
- **Handle AbortSignal** - Respect cancellation via `context.signal`
- **Parse responses** - JSON, text, blob based on Content-Type
- **Throw errors properly** - Use HttpError for 4xx/5xx responses
- **Document configuration** - Explain driver-specific options

### ❌ DON'T

- **Ignore context** - Use `context.signal`, `context.statsHub`
- **Swallow errors** - Let errors propagate to Luminara
- **Change response format** - Must match expected structure
- **Block indefinitely** - Always respect timeout/abort
- **Assume environment** - Check for browser/Node.js features

## Driver Context Properties

Available in `context` object:

```javascript
{
  signal: AbortSignal,      // Cancellation signal
  statsHub: StatsHub,       // Stats system (if enabled)
  attempt: number,          // Current retry attempt
  maxRetries: number,       // Max retry attempts
  timestamp: number,        // Request start time
  requestId: string         // Unique request ID
}
```

## Testing Custom Drivers

```javascript
import { createLuminara } from 'luminara';

// Test driver implementation
async function testDriver() {
  const driver = MyCustomDriver();
  
  const api = createLuminara({
    driver,
    retry: 0  // Disable retry for testing
  });
  
  // Test GET
  const getResponse = await api.get('https://jsonplaceholder.typicode.com/posts/1');
  console.assert(getResponse.status === 200, 'GET should return 200');
  console.assert(getResponse.data.id === 1, 'GET should return post 1');
  
  // Test POST
  const postResponse = await api.post('https://jsonplaceholder.typicode.com/posts', {
    title: 'Test',
    body: 'Test body'
  });
  console.assert(postResponse.status === 201, 'POST should return 201');
  
  // Test error handling
  try {
    await api.get('https://jsonplaceholder.typicode.com/posts/99999');
    console.error('Should have thrown error');
  } catch (error) {
    console.assert(error.status === 404, 'Should throw 404 error');
  }
  
  console.log('✅ All driver tests passed');
}

testDriver();
```

## See Also

- [Basic Usage](./basic-usage.md)
- [Interceptors](./interceptors.md)
- [Stats System](./stats.md)

---

**📖 [Back to Features Documentation](./README.md)**
