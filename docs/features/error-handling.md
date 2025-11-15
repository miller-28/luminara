# Error Handling

Comprehensive error categorization and handling with retry integration.

## 📋 Table of Contents

- [Overview](#overview)
- [Error Types](#error-types)
- [Error Structure](#error-structure)
- [Configuration](#configuration)
- [Examples](#examples)
- [Best Practices](#best-practices)

## Overview

Luminara provides rich error context and categorization to help you handle failures gracefully and make informed retry decisions.

### Key Features

- **Error Categorization** - NetworkError, TimeoutError, HttpError, AbortError
- **Rich Context** - Request/response details, attempt info, timestamps
- **Retry Integration** - Errors trigger automatic retries
- **Stats Tracking** - Error metrics and analytics
- **Type Safety** - Predictable error structure

## Error Types

### 1. NetworkError

Network-level failures (DNS, connection refused, etc.):

```javascript
try {
  await api.get('https://nonexistent-domain-12345.com');
} catch (error) {
  console.log(error.name);          // 'NetworkError'
  console.log(error.message);       // 'Failed to fetch'
  console.log(error.isNetworkError); // true
}
```

### 2. TimeoutError

Request exceeded timeout limit:

```javascript
try {
  await api.get('/api/slow', { timeout: 1000 });
} catch (error) {
  console.log(error.name);         // 'TimeoutError'
  console.log(error.message);      // 'Request timeout after 1000ms'
  console.log(error.timeout);      // 1000
  console.log(error.isTimeout);    // true
}
```

### 3. HttpError

HTTP error status codes (4xx, 5xx):

```javascript
try {
  await api.get('/api/not-found');
} catch (error) {
  console.log(error.name);         // 'HttpError'
  console.log(error.status);       // 404
  console.log(error.statusText);   // 'Not Found'
  console.log(error.isHttpError);  // true
  console.log(error.response);     // Full response object
}
```

### 4. AbortError

Request canceled manually or by debouncing:

```javascript
const controller = new AbortController();

const promise = api.get('/api/data', {
  signal: controller.signal
});

controller.abort();

try {
  await promise;
} catch (error) {
  console.log(error.name);      // 'AbortError'
  console.log(error.message);   // 'Request aborted'
  console.log(error.isAborted); // true
}
```

## Error Structure

All errors include these properties:

```javascript
{
  name: string,              // Error type
  message: string,           // Error description
  url: string,               // Request URL
  method: string,            // HTTP method
  timestamp: number,         // When error occurred
  attempt: number,           // Current retry attempt
  maxRetries: number,        // Max retry attempts
  
  // Error type flags
  isNetworkError: boolean,
  isTimeout: boolean,
  isHttpError: boolean,
  isAborted: boolean,
  
  // HttpError specific
  status?: number,           // HTTP status code
  statusText?: string,       // HTTP status text
  response?: object,         // Full response object
  
  // TimeoutError specific
  timeout?: number,          // Timeout value in ms
  
  // Original error
  cause?: Error              // Original error object
}
```

## Configuration

### Retry on Specific Errors

```javascript
const api = createLuminara({
  retry: 3,
  retryDelay: 1000,
  retryStatusCodes: [408, 429, 500, 502, 503, 504],  // Retry these statuses
  retryOnNetworkError: true,   // Retry network errors (default: true)
  retryOnTimeout: true          // Retry timeouts (default: true)
});
```

### Custom Error Handling with Interceptors

```javascript
api.use({
  name: 'error-handler',
  onResponseError(context) {
    const { error, attempt, maxRetries } = context;
    
    // Custom error logic
    if (error.status === 401) {
      // Refresh token and retry
      return refreshTokenAndRetry(context);
    }
    
    // Log error
    console.error(`Attempt ${attempt}/${maxRetries}:`, error.message);
    
    // Re-throw to continue error flow
    throw error;
  }
});
```

## Examples

### Example 1: Basic Error Handling

```javascript
const api = createLuminara();

try {
  const response = await api.get('https://jsonplaceholder.typicode.com/posts/9999');
} catch (error) {
  if (error.isHttpError) {
    console.error(`HTTP ${error.status}: ${error.statusText}`);
    console.error('Response data:', error.response.data);
  } else if (error.isNetworkError) {
    console.error('Network error:', error.message);
  } else if (error.isTimeout) {
    console.error('Request timed out after', error.timeout, 'ms');
  }
}
```

### Example 2: Categorized Error Handling

```javascript
const api = createLuminara({
  retry: 3,
  timeout: 5000
});

async function fetchWithCategorization(url) {
  try {
    return await api.get(url);
  } catch (error) {
    switch (error.name) {
      case 'NetworkError':
        showErrorUI('Network connection lost. Please check your internet.');
        break;
        
      case 'TimeoutError':
        showErrorUI('Request is taking too long. Please try again.');
        break;
        
      case 'HttpError':
        if (error.status === 404) {
          showErrorUI('Resource not found.');
        } else if (error.status === 403) {
          showErrorUI('Access denied.');
        } else if (error.status >= 500) {
          showErrorUI('Server error. Please try again later.');
        } else {
          showErrorUI(`Error: ${error.statusText}`);
        }
        break;
        
      case 'AbortError':
        console.log('Request was canceled');
        break;
        
      default:
        showErrorUI('An unexpected error occurred.');
    }
    
    throw error;
  }
}
```

### Example 3: Retry with Error Logging

```javascript
const api = createLuminara({
  retry: 3,
  retryDelay: 1000,
  backoffStrategy: 'exponential',
  verbose: true
});

api.use({
  name: 'error-logger',
  onResponseError(context) {
    const { error, attempt, maxRetries } = context;
    
    console.log(`
      ❌ Error on attempt ${attempt}/${maxRetries}
      Type: ${error.name}
      Status: ${error.status || 'N/A'}
      Message: ${error.message}
      URL: ${error.url}
    `);
    
    // Continue error flow
    throw error;
  }
});

try {
  await api.get('https://httpbin.org/status/500');
} catch (error) {
  console.error('Final error after all retries:', error);
}

// Logs:
// ❌ Error on attempt 1/3 - Type: HttpError, Status: 500
// ❌ Error on attempt 2/3 - Type: HttpError, Status: 500
// ❌ Error on attempt 3/3 - Type: HttpError, Status: 500
// Final error after all retries: HttpError {...}
```

### Example 4: Token Refresh on 401

```javascript
const api = createLuminara({
  retry: 1  // One retry for auth refresh
});

let isRefreshing = false;
let refreshPromise = null;

api.use({
  name: 'auth-refresh',
  async onResponseError(context) {
    const { error, req } = context;
    
    if (error.status === 401 && !req.headers.get('X-Retry-After-Refresh')) {
      // Prevent multiple simultaneous refresh attempts
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshAuthToken();
      }
      
      // Wait for token refresh
      await refreshPromise;
      isRefreshing = false;
      
      // Retry original request with new token
      context.req.headers.set('Authorization', `Bearer ${getNewToken()}`);
      context.req.headers.set('X-Retry-After-Refresh', 'true');
      
      // Trigger retry
      throw error;
    }
    
    // Not a 401 or already retried - propagate error
    throw error;
  }
});

async function refreshAuthToken() {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include'
  });
  
  const { token } = await response.json();
  localStorage.setItem('token', token);
  return token;
}

function getNewToken() {
  return localStorage.getItem('token');
}
```

### Example 5: Error Stats Monitoring

```javascript
const api = createLuminara({
  retry: 3,
  statsEnabled: true
});

// Make requests with mixed success/failure
for (let i = 0; i < 100; i++) {
  try {
    if (i % 5 === 0) {
      await api.get('https://httpbin.org/status/500');
    } else {
      await api.get('https://jsonplaceholder.typicode.com/posts/1');
    }
  } catch (error) {
    // Errors tracked automatically
  }
}

// Check error statistics
const errorStats = api.stats().errors.get();

console.log(`Total errors: ${errorStats.totalErrors}`);
console.log(`Error rate: ${(errorStats.errorRate * 100).toFixed(2)}%`);
console.log(`Errors by type:`, errorStats.byType);
console.log(`Errors by status:`, errorStats.byStatusCode);
console.log(`Most common error: ${errorStats.mostCommonError}`);

// Output:
// Total errors: 20
// Error rate: 20.00%
// Errors by type: { HttpError: 20 }
// Errors by status: { 500: 20 }
// Most common error: HttpError
```

### Example 6: Conditional Retry

```javascript
const api = createLuminara({
  retry: 3
});

api.use({
  name: 'conditional-retry',
  onResponseError(context) {
    const { error, attempt } = context;
    
    // Only retry on specific errors
    const shouldRetry = 
      error.isNetworkError ||
      error.isTimeout ||
      (error.isHttpError && [500, 502, 503, 504].includes(error.status));
    
    if (!shouldRetry) {
      console.log(`Not retrying ${error.status} error`);
      throw error;  // Don't retry
    }
    
    if (attempt < 3) {
      console.log(`Retrying... (attempt ${attempt + 1})`);
      throw error;  // Trigger retry
    }
    
    // Max retries reached
    throw error;
  }
});
```

### Example 7: User-Friendly Error Messages

```javascript
const api = createLuminara({
  retry: 2,
  timeout: 5000
});

function getUserFriendlyMessage(error) {
  if (error.isNetworkError) {
    return {
      title: 'Connection Problem',
      message: 'Unable to reach the server. Please check your internet connection.',
      icon: '🌐'
    };
  }
  
  if (error.isTimeout) {
    return {
      title: 'Request Timeout',
      message: 'The server is taking too long to respond. Please try again.',
      icon: '⏱️'
    };
  }
  
  if (error.isHttpError) {
    if (error.status === 404) {
      return {
        title: 'Not Found',
        message: 'The requested resource could not be found.',
        icon: '🔍'
      };
    }
    
    if (error.status === 403) {
      return {
        title: 'Access Denied',
        message: 'You do not have permission to access this resource.',
        icon: '🔒'
      };
    }
    
    if (error.status >= 500) {
      return {
        title: 'Server Error',
        message: 'The server encountered an error. Please try again later.',
        icon: '⚠️'
      };
    }
  }
  
  return {
    title: 'Error',
    message: 'An unexpected error occurred. Please try again.',
    icon: '❌'
  };
}

// Usage
try {
  await api.get('/api/data');
} catch (error) {
  const { title, message, icon } = getUserFriendlyMessage(error);
  showNotification(`${icon} ${title}`, message);
}
```

### Example 8: Error Reporting Service

```javascript
const api = createLuminara({
  retry: 3,
  statsEnabled: true
});

api.use({
  name: 'error-reporter',
  onResponseError(context) {
    const { error, req, attempt, maxRetries } = context;
    
    // Only report on final failure
    if (attempt === maxRetries) {
      reportErrorToService({
        type: error.name,
        url: error.url,
        method: error.method,
        status: error.status,
        message: error.message,
        timestamp: error.timestamp,
        userAgent: navigator.userAgent,
        requestBody: req.body,
        responseBody: error.response?.data
      });
    }
    
    throw error;
  }
});

async function reportErrorToService(errorData) {
  try {
    await fetch('/api/errors/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorData)
    });
  } catch (reportError) {
    console.error('Failed to report error:', reportError);
  }
}
```

## Best Practices

### ✅ DO

- **Use error type flags** - Check `isHttpError`, `isNetworkError`, etc.
- **Handle retryable errors** - Network errors, timeouts, 5xx statuses
- **Provide user-friendly messages** - Transform technical errors
- **Log error context** - Include attempt, URL, status for debugging
- **Monitor error stats** - Track error rates and types

### ❌ DON'T

- **Retry 4xx errors** - Client errors (except 408, 429) shouldn't retry
- **Ignore error types** - Different errors need different handling
- **Show technical errors to users** - Use friendly messages
- **Retry indefinitely** - Always have max retry limit
- **Swallow errors silently** - Log or report all errors

## Error Retry Guidelines

| Error Type | Retry? | Reason |
|------------|--------|--------|
| **NetworkError** | ✅ Yes | Transient network issues |
| **TimeoutError** | ✅ Yes | Server may respond on retry |
| **500 Internal Server Error** | ✅ Yes | Transient server issue |
| **502 Bad Gateway** | ✅ Yes | Upstream server issue |
| **503 Service Unavailable** | ✅ Yes | Server temporarily down |
| **504 Gateway Timeout** | ✅ Yes | Upstream server timeout |
| **408 Request Timeout** | ✅ Yes | Request timeout |
| **429 Too Many Requests** | ✅ Yes (with backoff) | Rate limited |
| **400 Bad Request** | ❌ No | Invalid request data |
| **401 Unauthorized** | ❌ No (unless refreshing auth) | Not authenticated |
| **403 Forbidden** | ❌ No | Not authorized |
| **404 Not Found** | ❌ No | Resource doesn't exist |
| **AbortError** | ❌ No | Intentionally canceled |

## See Also

- [Retry System](./retry.md)
- [Backoff Strategies](./backoff-strategies.md)
- [Interceptors](./interceptors.md)
- [Stats System](./stats.md)

---

**📖 [Back to Features Documentation](./README.md)**
