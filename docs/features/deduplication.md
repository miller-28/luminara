# Request Deduplication

Intelligent in-flight request deduplication to prevent duplicate network calls.

## 📋 Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Configuration](#configuration)
- [Examples](#examples)
- [Best Practices](#best-practices)

## Overview

Request deduplication automatically detects and merges duplicate in-flight requests, reducing unnecessary network calls and server load.

### Key Features

- **Automatic Detection** - Identifies duplicate requests by URL + method
- **In-Flight Only** - Only deduplicates currently executing requests
- **Shared Response** - All duplicate callers receive the same response
- **Zero Config** - Works out of the box when enabled
- **Opt-Out Support** - Disable per-request when needed

## How It Works

When deduplication is enabled:

1. **Request initiated** → Check for in-flight duplicate
2. **Duplicate found?** → Return existing promise (no new network call)
3. **No duplicate?** → Execute request normally
4. **Request completes** → All waiting callers receive response

### Visual Example

```
Time 0ms:  Request A → GET /api/users → [Network call starts]
Time 10ms: Request B → GET /api/users → [Detected duplicate, wait for A]
Time 15ms: Request C → GET /api/users → [Detected duplicate, wait for A]
Time 200ms: Request A completes → All A, B, C receive same response
```

**Result**: 1 network call instead of 3 (3x reduction)

## Configuration

### Enable Deduplication

```javascript
import { createLuminara } from 'luminara';

const api = createLuminara({
  deduplicateRequests: true  // Enable deduplication
});
```

### Disable Per-Request

```javascript
// Force new request even if duplicate in-flight
await api.get('/api/users', {
  deduplicateRequests: false
});
```

### Deduplication Key

Requests are considered duplicates if they match:

- **URL** (exact match)
- **Method** (GET, POST, PUT, DELETE, etc.)

**Note**: Query parameters, headers, and body are NOT compared (only URL + method).

## Examples

### Example 1: Basic Deduplication

```javascript
const api = createLuminara({
  deduplicateRequests: true
});

console.time('3 requests');

// Fire 3 identical requests simultaneously
const [res1, res2, res3] = await Promise.all([
  api.get('https://jsonplaceholder.typicode.com/posts/1'),
  api.get('https://jsonplaceholder.typicode.com/posts/1'),
  api.get('https://jsonplaceholder.typicode.com/posts/1')
]);

console.timeEnd('3 requests');
// Expected: ~200ms (1 network call)
// Without deduplication: ~600ms (3 network calls)

console.log('All responses identical:', 
  res1.data.id === res2.data.id && res2.data.id === res3.data.id
);
// true - all received same response
```

### Example 2: React Component Pattern

```javascript
// ❌ WITHOUT DEDUPLICATION:
// Multiple components request same data → Multiple network calls

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    api.get(`/api/users/${userId}`)
      .then(res => setUser(res.data));
  }, [userId]);
  
  // ... component rendering
}

// If 3 UserProfile components mount simultaneously with same userId:
// Without deduplication: 3 network calls
// With deduplication: 1 network call (2 duplicates merged)

// ✅ WITH DEDUPLICATION:
const api = createLuminara({
  deduplicateRequests: true
});

// Now all 3 components automatically share 1 network call
```

### Example 3: Rapid User Interactions

```javascript
const api = createLuminara({
  deduplicateRequests: true
});

// User rapidly clicks "Refresh" button
document.querySelector('#refresh-btn').addEventListener('click', async () => {
  const response = await api.get('/api/data');
  updateUI(response.data);
});

// Scenario: User clicks button 5 times rapidly
// Without deduplication: 5 network calls
// With deduplication: 1 network call (4 duplicates merged)
```

### Example 4: Disable When Needed

```javascript
const api = createLuminara({
  deduplicateRequests: true
});

// Normal request - deduplicated
await api.get('/api/users/1');

// Force fresh request (e.g., after mutation)
await api.post('/api/users/1', { name: 'Updated' });

// Get fresh data - disable deduplication
await api.get('/api/users/1', {
  deduplicateRequests: false  // Force new network call
});
```

### Example 5: Monitoring Deduplication

```javascript
const api = createLuminara({
  deduplicateRequests: true,
  statsEnabled: true,
  verbose: true
});

// Fire duplicate requests
await Promise.all([
  api.get('https://jsonplaceholder.typicode.com/posts/1'),
  api.get('https://jsonplaceholder.typicode.com/posts/1'),
  api.get('https://jsonplaceholder.typicode.com/posts/1')
]);

// Verbose logs will show:
// [API] 🔑 Deduplication: Request merged with in-flight duplicate
// [API] 🔑 Deduplication: Request merged with in-flight duplicate
// [API] 🌐 Network: Executing request

// Check stats
const stats = api.stats().counter.get();
console.log(`Total requests: ${stats.totalRequests}`);
// 3 (all counted)

console.log(`Network calls: 1`);
// Only 1 actual network call (2 deduplicated)
```

### Example 6: Comparison with Debouncing

```javascript
// DEDUPLICATION: Merges in-flight requests
const dedupeApi = createLuminara({
  deduplicateRequests: true
});

const [a, b, c] = await Promise.all([
  dedupeApi.get('/api/data'),
  dedupeApi.get('/api/data'),
  dedupeApi.get('/api/data')
]);
// Result: 1 network call, all receive response immediately

// DEBOUNCING: Delays and cancels requests
const debounceApi = createLuminara({
  debounce: 300  // 300ms delay
});

// Fire 3 requests rapidly
debounceApi.get('/api/data');  // Canceled
debounceApi.get('/api/data');  // Canceled
debounceApi.get('/api/data');  // Executes after 300ms
// Result: 1 network call, but 300ms delay
```

## Best Practices

### ✅ DO

- **Enable globally** - Safe to enable for most applications
- **Use with GET requests** - Idempotent requests benefit most
- **Combine with caching** - Deduplication prevents duplicate calls, caching prevents all calls
- **Monitor stats** - Track deduplication effectiveness with stats
- **Disable after mutations** - Force fresh request after POST/PUT/DELETE

### ❌ DON'T

- **Use for mutation requests** - POST/PUT/DELETE should usually bypass deduplication
- **Rely on headers** - Deduplication ignores headers (URL + method only)
- **Expect caching** - Deduplication ≠ caching (only merges in-flight requests)
- **Use with streaming** - Deduplication not suitable for streaming responses

## Deduplication vs Debouncing vs Caching

| Feature | Deduplication | Debouncing | Caching |
|---------|---------------|------------|---------|
| **Purpose** | Merge duplicate calls | Delay rapid calls | Store responses |
| **When** | In-flight only | Configurable delay | Persistent |
| **Network calls** | Reduced | Reduced | Eliminated |
| **Response time** | Immediate | Delayed | Immediate |
| **Use case** | Concurrent duplicates | Rapid user input | Static data |

## Common Use Cases

### 1. React Component Mounting

Multiple components requesting same data on mount:

```javascript
// 3 UserCard components mount with same userId
// Deduplication: 1 network call
// Without: 3 network calls
```

### 2. Parallel Module Initialization

App modules initializing in parallel:

```javascript
// auth.js, theme.js, config.js all request /api/config
// Deduplication: 1 network call
// Without: 3 network calls
```

### 3. Rapid User Interactions

User rapidly clicking/scrolling:

```javascript
// User clicks "Load More" button 5 times rapidly
// Deduplication: 1 network call
// Without: 5 network calls
```

### 4. WebSocket Reconnection

Multiple modules reacting to reconnection:

```javascript
// 10 modules request fresh data after WebSocket reconnect
// Deduplication: Grouped by URL (e.g., 3 unique URLs = 3 calls)
// Without: 10 network calls
```

## Performance Impact

**Memory**: ~10KB per 1,000 unique in-flight requests  
**CPU**: <0.05ms per request  
**Network savings**: 30-70% reduction in typical applications

## See Also

- [Request Debouncing](./debouncing.md)
- [Rate Limiting](./rate-limiting.md)
- [Stats System](./stats.md)

---

**📖 [Back to Features Documentation](./README.md)**
