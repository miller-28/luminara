# 🌌 Luminara

**Luminara** is a lightweight, plugin-based HTTP client built on [ofetch](https://github.com/unjs/ofetch).  
Like light traveling through space, Luminara guides your HTTP requests with grace, reliability, and cosmic precision. ✨

---

## ✨ Features

- ⚡ Built on modern `fetch` via ofetch
- 🔌 Powerful plugin architecture (interceptors, transformers, error handlers)
- 🔄 Advanced retry logic with 6 backoff strategies
- ⏱️ Configurable timeouts and status code handling
- 💎 Tiny footprint (~10KB + ofetch)
- 🪶 Zero dependencies besides ofetch
- 🎯 Fully promise-based and type-friendly
- 🚗 Custom driver support

---

## 📦 Installation

```bash
# npm
npm install luminara

# yarn
yarn add luminara

# pnpm
pnpm add luminara
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

## 🔄 Retry & Backoff Strategies

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

## 🔌 Plugin System

Luminara's plugin architecture allows you to intercept and transform requests at different lifecycle stages.

### Request Interceptor

Modify requests before they're sent:

```js
api.use({
	onRequest(request) {
		console.log('📤 Sending:', request.method, request.url);
		
		// Add custom headers
		request.headers = {
			...(request.headers || {}),
			'X-Custom-Header': 'Luminara',
			'Authorization': `Bearer ${getToken()}`
		};
		
		return request;
	}
});
```

### Response Transformer

Transform responses after they arrive:

```js
api.use({
	onSuccess(response) {
		console.log('📥 Received:', response.status);
		
		// Add metadata
		response.data.timestamp = new Date().toISOString();
		response.data.transformed = true;
		
		return response;
	}
});
```

### Error Handler

Handle errors globally:

```js
api.use({
	onError(error, request) {
		console.error('❌ Request failed:', request.url);
		console.error('Error:', error.message);
		
		// Log to analytics service
		analytics.trackError(error);
	}
});
```

### Multiple Plugins

Chain multiple plugins for complex workflows:

```js
// Authentication plugin
api.use({
	onRequest(req) {
		req.headers = { ...req.headers, 'Authorization': `Bearer ${token}` };
		return req;
	}
});

// Logging plugin
api.use({
	onRequest(req) {
		console.log('→', req.method, req.url);
		return req;
	},
	onSuccess(res) {
		console.log('✓', res.status);
		return res;
	}
});

// Analytics plugin
api.use({
	onSuccess(res) {
		analytics.track('api_success', { url: res.url });
		return res;
	},
	onError(err, req) {
		analytics.track('api_error', { url: req.url, error: err.message });
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

Replace the default ofetch driver with your own implementation:

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

## 🌈 Example in React

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
```

---

## 🧩 Project Structure

```
luminara/
  src/
    index.js              # entry point
    core/
      driver.js           # generic driver interface
      luminara.js         # core client + plugin system
    drivers/
      ofetch.js           # default driver
  package.json
  README.md
    LICENSE
```

---

## 📚 Documentation

- **[Sandbox Guide](./sandbox/README.md)** - Interactive examples and usage
- **[Architecture Guide](./sandbox/ARCHITECTURE.md)** - Separation of concerns implementation
- **[Copilot Instructions](./.github/copilot-instructions.md)** - AI development guidelines
- **[Separation of Concerns](./.github/SEPARATION_OF_CONCERNS.md)** - Core architectural principles

---

## 🛣️ Roadmap

- [x] Core HTTP methods (GET, POST, PUT, PATCH, DELETE)
- [x] Plugin system (onRequest, onSuccess, onError)
- [x] Retry logic with configurable attempts
- [x] 6 Backoff strategies (linear, exponential, fibonacci, jitter, etc.)
- [x] Custom retry handlers
- [x] Timeout support
- [x] Retry on specific status codes
- [x] Custom driver support
- [x] Interactive sandbox with 21 examples
- [ ] Request debouncer (per key)
- [ ] Rate limiter (token bucket)
- [ ] Cache adapter (localStorage/memory)
- [ ] Request tracing and metrics
- [ ] TypeScript definitions

---

## 🧠 License

MIT © 2025 [Jonathan Miller](mailto:jonathan@miller28.com) • [LinkedIn](https://www.linkedin.com/in/miller28/)

Includes portions of [ofetch](https://github.com/unjs/ofetch) (MIT License)

---

## 🪐 Philosophy

**Luminara** — derived from "lumen" (light) — symbolizes clarity and adaptability.

Like light traveling through space, Luminara guides your HTTP requests with grace, reliability, and cosmic precision. Built with mindfulness for developers who craft with intention.

**Simple by Design** • **Separation of Concerns** • **Developer-Friendly** • **Extensible**

✨ *May your requests flow like starlight* ✨
```

---

## 🪄 Future Add-ons

Luminara’s roadmap includes:

- [ ] Retry with exponential backoff  
- [ ] Request debouncer (per key)  
- [ ] Rate limiter (token bucket)  
- [ ] Cache adapter (localStorage / memory)  
- [ ] Request tracing and metrics  
- [ ] Configurable interceptors  

---

## 🧠 License

MIT © 2025 Jonathan Miller  
Includes portions of [ofetch](https://github.com/unjs/ofetch) (MIT License)

---

## 🪐 Name Origin

**Luminara** — derived from “lumen” (light) — symbolizes clarity and adaptability.  
A library that brings *light* to the world of fetching: minimal yet full of potential.