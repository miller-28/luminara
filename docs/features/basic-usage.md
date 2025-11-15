# Basic Usage

Getting started with Luminara - HTTP verbs, configuration, and fundamental operations.

## 📋 Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [HTTP Methods](#http-methods)
- [Configuration](#configuration)
- [Response Structure](#response-structure)
- [Examples](#examples)

## Installation

```bash
npm install luminara
```

## Quick Start

```javascript
import { createLuminara } from 'luminara';

// Create client instance
const api = createLuminara({
  baseURL: 'https://api.example.com',
  timeout: 5000
});

// Make GET request
const response = await api.get('/users');
console.log(response.data);
```

## HTTP Methods

Luminara provides convenient methods for all HTTP verbs:

### GET

```javascript
// Simple GET
const users = await api.get('/users');

// GET with query params
const filteredUsers = await api.get('/users', {
  params: { role: 'admin', active: true }
});
// → /users?role=admin&active=true
```

### POST

```javascript
// POST with JSON body
const newUser = await api.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// POST with custom options
const response = await api.post('/users', userData, {
  headers: { 'X-Custom': 'value' },
  timeout: 10000
});
```

### PUT

```javascript
// Update resource
const updated = await api.put('/users/123', {
  name: 'Jane Doe',
  email: 'jane@example.com'
});
```

### PATCH

```javascript
// Partial update
const patched = await api.patch('/users/123', {
  email: 'newemail@example.com'
});
```

### DELETE

```javascript
// Delete resource
await api.delete('/users/123');

// Delete with body
await api.delete('/users/bulk', {
  body: { ids: [1, 2, 3] }
});
```

### HEAD

```javascript
// Get headers only (no body)
const response = await api.head('/users/123');
console.log(response.headers.get('Content-Type'));
```

### OPTIONS

```javascript
// Get allowed methods
const response = await api.options('/users');
console.log(response.headers.get('Allow'));
```

## Configuration

### Global Configuration

```javascript
const api = createLuminara({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  headers: {
    'Authorization': 'Bearer token123',
    'Content-Type': 'application/json'
  },
  retry: 3,
  retryDelay: 1000,
  statsEnabled: true
});
```

### Per-Request Configuration

```javascript
// Override global settings
const response = await api.get('/users', {
  timeout: 10000,
  headers: {
    'X-Custom-Header': 'value'
  },
  params: {
    page: 1,
    limit: 20
  }
});
```

## Response Structure

All responses follow this structure:

```javascript
{
  data: any,              // Response body (parsed)
  status: 200,            // HTTP status code
  statusText: 'OK',       // HTTP status text
  headers: Headers,       // Response headers
  config: {...},          // Request configuration
  request: {...}          // Request details
}
```

## Examples

### Example 1: Simple REST API

```javascript
import { createLuminara } from 'luminara';

const api = createLuminara({
  baseURL: 'https://jsonplaceholder.typicode.com'
});

// List users
const users = await api.get('/users');
console.log('Users:', users.data);

// Get single user
const user = await api.get('/users/1');
console.log('User:', user.data.name);

// Create user
const newUser = await api.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
});
console.log('Created:', newUser.data);

// Update user
const updated = await api.put('/users/1', {
  name: 'Jane Doe',
  email: 'jane@example.com'
});
console.log('Updated:', updated.data);

// Delete user
await api.delete('/users/1');
console.log('Deleted successfully');
```

### Example 2: Query Parameters

```javascript
const api = createLuminara({
  baseURL: 'https://api.example.com'
});

// Method 1: Using params option
const response1 = await api.get('/search', {
  params: {
    q: 'javascript',
    category: 'books',
    page: 1,
    limit: 20
  }
});
// → /search?q=javascript&category=books&page=1&limit=20

// Method 2: Manual URL construction
const response2 = await api.get('/search?q=javascript&category=books');

// Method 3: URL encoding special characters
const response3 = await api.get('/search', {
  params: {
    q: 'hello world',  // Automatically encoded
    tags: ['javascript', 'tutorial']
  }
});
// → /search?q=hello%20world&tags=javascript&tags=tutorial
```

### Example 3: Custom Headers

```javascript
const api = createLuminara();

// Global headers
api.setHeaders({
  'Authorization': 'Bearer token123',
  'X-API-Key': 'abc123'
});

// Per-request headers
const response = await api.get('/api/data', {
  headers: {
    'X-Custom-Header': 'value',
    'Accept-Language': 'en-US'
  }
});

// Merge with global headers
const merged = await api.post('/api/data', body, {
  headers: {
    'Content-Type': 'application/xml'  // Overrides global
  }
});
```

### Example 4: FormData Upload

```javascript
const api = createLuminara();

// Create FormData
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('title', 'My File');
formData.append('description', 'File description');

// Upload with postForm
const response = await api.postForm('/upload', formData);
console.log('Uploaded:', response.data);

// Alternative: Manual FormData with post
const response2 = await api.post('/upload', formData, {
  headers: {
    // Let browser set Content-Type with boundary
    // Don't set Content-Type manually for FormData
  }
});
```

### Example 5: Response Types

```javascript
const api = createLuminara();

// JSON response (default)
const jsonData = await api.getJson('/api/data');
console.log(jsonData.data);

// Text response
const textData = await api.getText('/api/readme');
console.log(textData.data);

// Blob response (files)
const blob = await api.getBlob('/api/image.jpg');
const imageUrl = URL.createObjectURL(blob.data);

// ArrayBuffer
const buffer = await api.getArrayBuffer('/api/data.bin');
console.log(buffer.data.byteLength);

// Stream
const stream = await api.getStream('/api/large-file');
const reader = stream.data.getReader();
```

### Example 6: Error Handling

```javascript
const api = createLuminara();

try {
  const response = await api.get('/api/data');
  console.log('Success:', response.data);
} catch (error) {
  if (error.isHttpError) {
    console.error('HTTP error:', error.status, error.statusText);
    console.error('Response:', error.response.data);
  } else if (error.isNetworkError) {
    console.error('Network error:', error.message);
  } else if (error.isTimeout) {
    console.error('Request timeout');
  } else {
    console.error('Unknown error:', error);
  }
}
```

### Example 7: Chaining Requests

```javascript
const api = createLuminara({
  baseURL: 'https://jsonplaceholder.typicode.com'
});

// Sequential requests
const user = await api.get('/users/1');
const userPosts = await api.get(`/users/${user.data.id}/posts`);
const firstPost = await api.get(`/posts/${userPosts.data[0].id}`);

console.log('User:', user.data.name);
console.log('Posts:', userPosts.data.length);
console.log('First post:', firstPost.data.title);

// Parallel requests
const [users, posts, comments] = await Promise.all([
  api.get('/users'),
  api.get('/posts'),
  api.get('/comments')
]);

console.log(`Loaded ${users.data.length} users`);
console.log(`Loaded ${posts.data.length} posts`);
console.log(`Loaded ${comments.data.length} comments`);
```

### Example 8: Request/Response Transformation

```javascript
const api = createLuminara();

// Transform request data
api.use({
  name: 'request-transformer',
  onRequest(context) {
    // Add timestamp to all requests
    context.req.headers.set('X-Request-Time', Date.now().toString());
    
    // Transform request body
    if (context.req.body) {
      context.req.body = {
        ...context.req.body,
        clientVersion: '1.0.0'
      };
    }
  }
});

// Transform response data
api.use({
  name: 'response-transformer',
  onResponse(context) {
    // Wrap all responses
    return {
      ...context.res,
      data: {
        payload: context.res.data,
        fetchedAt: Date.now()
      }
    };
  }
});

const response = await api.get('/api/data');
console.log(response.data.payload);
console.log(response.data.fetchedAt);
```

## Best Practices

### ✅ DO

- **Use baseURL** - Set common API base for cleaner code
- **Handle errors** - Always use try/catch with async/await
- **Use typed methods** - `getJson()`, `postForm()` for clarity
- **Set timeout** - Prevent hanging requests
- **Use params option** - Automatic URL encoding

### ❌ DON'T

- **Hardcode URLs** - Use baseURL for flexibility
- **Ignore errors** - Always handle potential failures
- **Mix URL schemes** - Use consistent http/https
- **Skip headers** - Set Auth, Content-Type appropriately
- **Forget await** - All methods return promises

## See Also

- [Base URL & Query Params](./base-url-query.md)
- [Response Types](./response-types.md)
- [Error Handling](./error-handling.md)
- [Interceptors](./interceptors.md)

---

**📖 [Back to Features Documentation](./README.md)**
