# Base URL & Query Parameters

Configure base URLs and build query strings with automatic URL encoding.

## 📋 Table of Contents

- [Overview](#overview)
- [Base URL Configuration](#base-url-configuration)
- [Query Parameters](#query-parameters)
- [URL Construction](#url-construction)
- [Examples](#examples)
- [Best Practices](#best-practices)

## Overview

Luminara provides flexible URL construction with base URL support and automatic query parameter encoding.

### Key Features

- **Base URL** - Set common API base for all requests
- **Automatic Encoding** - Safe handling of special characters
- **Query Builder** - Clean `params` option for query strings
- **URL Merging** - Intelligent path resolution
- **Relative/Absolute** - Support both URL types

## Base URL Configuration

### Global Base URL

```javascript
import { createLuminara } from 'luminara';

const api = createLuminara({
  baseURL: 'https://api.example.com/v1'
});

// All requests are relative to baseURL
await api.get('/users');          // → https://api.example.com/v1/users
await api.get('/posts');          // → https://api.example.com/v1/posts
await api.post('/comments', {}); // → https://api.example.com/v1/comments
```

### Override Base URL

```javascript
const api = createLuminara({
  baseURL: 'https://api-1.example.com'
});

// Use configured baseURL
await api.get('/users');  // → https://api-1.example.com/users

// Override with absolute URL
await api.get('https://api-2.example.com/data');  // → https://api-2.example.com/data
```

### No Base URL

```javascript
const api = createLuminara();

// Always use absolute URLs
await api.get('https://api.example.com/users');
await api.get('https://api.other.com/data');
```

## Query Parameters

### Using params Option

```javascript
const api = createLuminara({
  baseURL: 'https://api.example.com'
});

// Simple params
await api.get('/search', {
  params: {
    q: 'javascript',
    page: 1,
    limit: 20
  }
});
// → https://api.example.com/search?q=javascript&page=1&limit=20

// Automatic encoding
await api.get('/search', {
  params: {
    q: 'hello world',           // Encoded
    tags: 'foo & bar',          // Special chars encoded
    email: 'test@example.com'   // Safe chars preserved
  }
});
// → /search?q=hello%20world&tags=foo%20%26%20bar&email=test@example.com
```

### Array Parameters

```javascript
// Array values
await api.get('/filter', {
  params: {
    tags: ['javascript', 'tutorial', 'beginner']
  }
});
// → /filter?tags=javascript&tags=tutorial&tags=beginner

// Empty array (omitted)
await api.get('/filter', {
  params: {
    tags: []
  }
});
// → /filter (no tags param)
```

### Boolean Parameters

```javascript
await api.get('/users', {
  params: {
    active: true,
    verified: false
  }
});
// → /users?active=true&verified=false
```

### Null/Undefined Parameters

```javascript
await api.get('/search', {
  params: {
    q: 'test',
    filter: null,      // Omitted
    sort: undefined    // Omitted
  }
});
// → /search?q=test
```

## URL Construction

### Path Resolution

```javascript
const api = createLuminara({
  baseURL: 'https://api.example.com/v1'
});

// Relative paths (recommended)
await api.get('/users');       // → https://api.example.com/v1/users
await api.get('users');        // → https://api.example.com/v1/users

// Nested paths
await api.get('/users/123/posts');  // → https://api.example.com/v1/users/123/posts

// Absolute URLs (override baseURL)
await api.get('https://api-2.example.com/data');  // → https://api-2.example.com/data
```

### Trailing Slashes

```javascript
const api = createLuminara({
  baseURL: 'https://api.example.com/v1/'  // With trailing slash
});

// Both work correctly
await api.get('/users');   // → https://api.example.com/v1/users
await api.get('users');    // → https://api.example.com/v1/users
```

### Query String Merging

```javascript
// Manual query string + params option
await api.get('/search?q=test', {
  params: {
    page: 1,
    limit: 20
  }
});
// → /search?q=test&page=1&limit=20
```

## Examples

### Example 1: Multi-Environment Base URLs

```javascript
const API_BASE_URLS = {
  development: 'http://localhost:3000/api',
  staging: 'https://staging.example.com/api',
  production: 'https://api.example.com'
};

const api = createLuminara({
  baseURL: API_BASE_URLS[process.env.NODE_ENV] || API_BASE_URLS.development
});

// Same code works across environments
const users = await api.get('/users');
const posts = await api.get('/posts');
```

### Example 2: Versioned APIs

```javascript
// API v1
const apiV1 = createLuminara({
  baseURL: 'https://api.example.com/v1'
});

// API v2
const apiV2 = createLuminara({
  baseURL: 'https://api.example.com/v2'
});

// Use appropriate version
const oldUsers = await apiV1.get('/users');
const newUsers = await apiV2.get('/users');
```

### Example 3: Complex Query Parameters

```javascript
const api = createLuminara({
  baseURL: 'https://api.example.com'
});

// Complex filter query
const response = await api.get('/products', {
  params: {
    category: 'electronics',
    priceMin: 100,
    priceMax: 500,
    brands: ['Apple', 'Samsung', 'Sony'],
    inStock: true,
    sort: 'price:asc',
    page: 1,
    limit: 20
  }
});

// Results in:
// /products?category=electronics&priceMin=100&priceMax=500
// &brands=Apple&brands=Samsung&brands=Sony&inStock=true
// &sort=price:asc&page=1&limit=20
```

### Example 4: Search with Encoding

```javascript
const api = createLuminara({
  baseURL: 'https://api.example.com'
});

// Special characters automatically encoded
const searchQuery = 'how to use "fetch" & "async/await"?';

const results = await api.get('/search', {
  params: {
    q: searchQuery,
    type: 'articles'
  }
});

// URL: /search?q=how%20to%20use%20%22fetch%22%20%26%20%22async%2Fawait%22%3F&type=articles
```

### Example 5: Pagination

```javascript
const api = createLuminara({
  baseURL: 'https://jsonplaceholder.typicode.com'
});

async function fetchPaginated(page = 1, limit = 10) {
  return await api.get('/posts', {
    params: {
      _page: page,
      _limit: limit
    }
  });
}

// Load first page
const page1 = await fetchPaginated(1, 20);
console.log('Page 1:', page1.data);

// Load second page
const page2 = await fetchPaginated(2, 20);
console.log('Page 2:', page2.data);
```

### Example 6: Dynamic Query Builder

```javascript
const api = createLuminara({
  baseURL: 'https://api.example.com'
});

function buildQuery(filters) {
  const params = {};
  
  if (filters.search) params.q = filters.search;
  if (filters.category) params.category = filters.category;
  if (filters.minPrice) params.priceMin = filters.minPrice;
  if (filters.maxPrice) params.priceMax = filters.maxPrice;
  if (filters.tags?.length) params.tags = filters.tags;
  
  return params;
}

// Usage
const filters = {
  search: 'laptop',
  category: 'electronics',
  minPrice: 500,
  tags: ['portable', 'gaming']
};

const products = await api.get('/products', {
  params: buildQuery(filters)
});
```

### Example 7: Multi-API Client

```javascript
// Create clients for different APIs
const githubAPI = createLuminara({
  baseURL: 'https://api.github.com',
  headers: {
    'Accept': 'application/vnd.github.v3+json'
  }
});

const jsonPlaceholderAPI = createLuminara({
  baseURL: 'https://jsonplaceholder.typicode.com'
});

const myAPI = createLuminara({
  baseURL: 'https://my-api.example.com',
  headers: {
    'Authorization': 'Bearer token123'
  }
});

// Use each API independently
const repos = await githubAPI.get('/users/octocat/repos');
const posts = await jsonPlaceholderAPI.get('/posts');
const userData = await myAPI.get('/me');
```

### Example 8: URL Template Pattern

```javascript
const api = createLuminara({
  baseURL: 'https://api.example.com'
});

// Helper for template URLs
function url(template, ...args) {
  return template.replace(/{(\d+)}/g, (match, index) => args[index] || '');
}

// Usage
const userId = 123;
const postId = 456;

const user = await api.get(url('/users/{0}', userId));
// → /users/123

const post = await api.get(url('/users/{0}/posts/{1}', userId, postId));
// → /users/123/posts/456

const comments = await api.get(url('/posts/{0}/comments', postId), {
  params: { limit: 10 }
});
// → /posts/456/comments?limit=10
```

## Best Practices

### ✅ DO

- **Set baseURL** - Cleaner code, easier environment switching
- **Use params option** - Automatic encoding, cleaner syntax
- **Use relative paths** - Works with baseURL changes
- **Validate input** - Check params before sending
- **Use versioning** - Include API version in baseURL

### ❌ DON'T

- **Hardcode full URLs** - Reduces flexibility
- **Manual encoding** - Use params option instead
- **Mix encodings** - Let Luminara handle all encoding
- **Forget validation** - Invalid params cause errors
- **Duplicate slashes** - Use consistent leading slash

## URL Construction Rules

```javascript
baseURL: 'https://api.example.com/v1'

// Rule 1: Relative path (leading slash)
'/users' → 'https://api.example.com/v1/users' ✅

// Rule 2: Relative path (no leading slash)
'users' → 'https://api.example.com/v1/users' ✅

// Rule 3: Absolute URL (overrides baseURL)
'https://other-api.com/data' → 'https://other-api.com/data' ✅

// Rule 4: baseURL with trailing slash
baseURL: 'https://api.example.com/v1/'
'/users' → 'https://api.example.com/v1/users' ✅

// Rule 5: Query params merge with existing query string
'/search?q=test' + params: {page: 1}
→ '/search?q=test&page=1' ✅
```

## Query Parameter Encoding

| Character | Encoded | Example |
|-----------|---------|---------|
| Space | `%20` | `hello world` → `hello%20world` |
| `&` | `%26` | `foo & bar` → `foo%20%26%20bar` |
| `=` | `%3D` | `key=value` → `key%3Dvalue` |
| `?` | `%3F` | `query?` → `query%3F` |
| `#` | `%23` | `section#1` → `section%231` |
| `/` | `%2F` | `path/to` → `path%2Fto` |
| `@` | Preserved | `test@example.com` → `test@example.com` |
| `-` `_` `.` `~` | Preserved | Safe characters |

## See Also

- [Basic Usage](./basic-usage.md)
- [Interceptors](./interceptors.md)
- [Error Handling](./error-handling.md)

---

**📖 [Back to Features Documentation](./README.md)**
