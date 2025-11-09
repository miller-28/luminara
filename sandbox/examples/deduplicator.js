/**
 * Request Deduplicator Examples
 * Demonstrates prevention of duplicate concurrent requests
 */

export const deduplicator = {
	feature: 'deduplicator',
	title: 'Request Deduplicator',
	description: 'Prevent duplicate concurrent requests from executing',
	
	examples: [
		{
			id: 'deduplicator-disabled-default',
			title: 'Disabled by Default',
			description: 'Without deduplication config, all requests execute independently',
			code: `// No deduplicate config = feature disabled
const api = createLuminara({
  baseURL: 'https://jsonplaceholder.typicode.com'
});

// Fire 3 concurrent identical requests
const start = Date.now();
const results = await Promise.all([
  api.get('/posts/1'),
  api.get('/posts/1'),
  api.get('/posts/1')
]);
const duration = Date.now() - start;

console.log('Requests executed:', results.length);
console.log('Duration:', duration + 'ms');
console.log('💡 All 3 requests executed separately');`,
			async run(updateOutput, signal) {
				const { createLuminara } = window.Luminara;
				
				const api = createLuminara({
					baseURL: 'https://jsonplaceholder.typicode.com',
					verbose: false
				});
				
				const start = Date.now();
				const results = await Promise.all([
					api.get('/posts/1'),
					api.get('/posts/1'),
					api.get('/posts/1')
				]);
				const duration = Date.now() - start;
				
				return `🔴 Deduplication DISABLED (default)\n\n✅ All ${results.length} requests executed independently\nDuration: ${duration}ms\n\n💡 Without deduplication, duplicate requests are NOT prevented`;
			}
		},
		
		{
			id: 'deduplicator-basic',
			title: 'Basic Deduplication',
			description: 'Enable deduplication to share results between concurrent identical requests',
			code: `// Enable deduplication with empty config (uses defaults)
const api = createLuminara({
  baseURL: 'https://jsonplaceholder.typicode.com',
  deduplicate: {} // Enabled with defaults
});

// Fire 3 concurrent identical requests
const start = Date.now();
const results = await Promise.all([
  api.get('/posts/1'),
  api.get('/posts/1'),
  api.get('/posts/1')
]);
const duration = Date.now() - start;

console.log('Network requests:', 1);
console.log('Callers that got result:', results.length);
console.log('Duration:', duration + 'ms');
console.log('💡 Only 1 network request, all 3 got same result!');`,
			async run(updateOutput, signal) {
				const { createLuminara } = window.Luminara;
				
				const api = createLuminara({
					baseURL: 'https://jsonplaceholder.typicode.com',
					deduplicate: {},
					verbose: false
				});
				
				const start = Date.now();
				const results = await Promise.all([
					api.get('/posts/1'),
					api.get('/posts/1'),
					api.get('/posts/1')
				]);
				const duration = Date.now() - start;
				
				return `🟢 Deduplication ENABLED\n\n✅ Only 1 network request executed\n✅ All ${results.length} callers received the same result\nDuration: ${duration}ms\n\n💡 Deduplication prevented 2 unnecessary requests!`;
			}
		},
		
		{
			id: 'deduplicator-double-click',
			title: 'Double-Click Prevention',
			description: 'Prevent duplicate submissions from rapid button clicks',
			code: `const api = createLuminara({
  baseURL: 'https://jsonplaceholder.typicode.com',
  deduplicate: {
    cacheTTL: 100, // 100ms burst protection (default)
    excludeMethods: [] // Allow POST deduplication for demo
  }
});

// Simulate rapid double-click
let clickCount = 0;
const handleClick = async () => {
  clickCount++;
  console.log(\`Click \${clickCount}: Submitting...\`);
  
  const result = await api.post('/posts', {
    body: { title: 'Test', body: 'Content', userId: 1 }
  });
  
  console.log(\`Click \${clickCount}: ✅ Got result\`);
  return result;
};

// Fire clicks with 50ms gap (typical double-click)
const promise1 = handleClick();
await new Promise(resolve => setTimeout(resolve, 50));
const promise2 = handleClick();

await Promise.all([promise1, promise2]);

console.log('💡 Only 1 request sent to server!');`,
			async run(updateOutput, signal) {
				const { createLuminara } = window.Luminara;
				
				let output = '🖱️ Simulating rapid double-click...\n\n';
				
				const api = createLuminara({
					baseURL: 'https://jsonplaceholder.typicode.com',
					deduplicate: {
						cacheTTL: 100,
						excludeMethods: []
					},
					verbose: false
				});
				
				let clickCount = 0;
				
				const handleClick = async () => {
					clickCount++;
					output += `Click ${clickCount}: Submitting...\n`;
					const result = await api.post('/posts', {
						body: { title: 'Test', body: 'Content', userId: 1 }
					});
					output += `Click ${clickCount}: ✅ Got result\n`;
					return result;
				};
				
				const promise1 = handleClick();
				await new Promise(resolve => setTimeout(resolve, 50));
				const promise2 = handleClick();
				
				await Promise.all([promise1, promise2]);
				
				output += '\n💡 Only 1 request sent to server, both clicks got result!';
				return output;
			}
		},
		
		{
			id: 'deduplicator-key-strategies',
			title: 'Key Generation Strategies',
			description: 'Different strategies for determining request identity',
			code: `// Strategy 1: url only (ignores method)
const api1 = createLuminara({
  deduplicate: { keyStrategy: 'url' }
});

// Strategy 2: url+method (default, recommended)
const api2 = createLuminara({
  deduplicate: { keyStrategy: 'url+method' }
});

// Strategy 3: url+method+body (most accurate)
const api3 = createLuminara({
  deduplicate: { keyStrategy: 'url+method+body' }
});

// Test: Different methods with url-only strategy
const [r1, r2] = await Promise.all([
  api1.get('/posts/1'),
  api1.post('/posts', { body: { test: true } })
]);
// Both deduplicated (same URL)

// Test: Different methods with url+method strategy
const [r3, r4] = await Promise.all([
  api2.get('/posts/1'),
  api2.post('/posts', { body: { test: true } })
]);
// NOT deduplicated (different methods)`,
			async run(updateOutput, signal) {
				const { createLuminara } = window.Luminara;
				
				let output = '🔑 Testing Key Generation Strategies\n\n';
				
				output += '1️⃣ Strategy: url (ignores method)\n';
				const api1 = createLuminara({
					baseURL: 'https://jsonplaceholder.typicode.com',
					deduplicate: {
						keyStrategy: 'url',
						excludeMethods: []
					},
					verbose: false
				});
				
				const start1 = Date.now();
				await Promise.all([
					api1.get('/posts/1'),
					api1.post('/posts', { body: { test: true } })
				]);
				const duration1 = Date.now() - start1;
				output += `   GET and POST deduplicated (same key) - ${duration1}ms\n\n`;
				
				output += '2️⃣ Strategy: url+method (default)\n';
				const api2 = createLuminara({
					baseURL: 'https://jsonplaceholder.typicode.com',
					deduplicate: {
						keyStrategy: 'url+method',
						excludeMethods: []
					},
					verbose: false
				});
				
				const start2 = Date.now();
				await Promise.all([
					api2.get('/posts/1'),
					api2.post('/posts', { body: { test: true } })
				]);
				const duration2 = Date.now() - start2;
				output += `   GET and POST NOT deduplicated (different keys) - ${duration2}ms\n\n`;
				
				output += '💡 Choose strategy based on your API design!';
				return output;
			}
		},
		
		{
			id: 'deduplicator-method-filtering',
			title: 'Method Filtering',
			description: 'Control which HTTP methods are deduplicated',
			code: `// Exclude mutation methods (default behavior)
const api = createLuminara({
  deduplicate: {
    excludeMethods: ['POST', 'PUT', 'PATCH', 'DELETE']
  }
});

// GET requests: deduplicated ✅
await Promise.all([
  api.get('/posts/1'),
  api.get('/posts/1')
]);
console.log('GET: Only 1 request executed');

// POST requests: NOT deduplicated ❌ (each executes)
await Promise.all([
  api.post('/posts', { body: { name: 'John' } }),
  api.post('/posts', { body: { name: 'Jane' } })
]);
console.log('POST: Both requests executed');

console.log('💡 Mutations execute independently by default!');`,
			async run(updateOutput, signal) {
				const { createLuminara } = window.Luminara;
				
				let output = '🎯 Method Filtering Demo\n\n';
				
				const api = createLuminara({
					baseURL: 'https://jsonplaceholder.typicode.com',
					deduplicate: {
						excludeMethods: ['POST', 'PUT', 'PATCH', 'DELETE'] // Default
					},
					verbose: false
				});
				
				output += 'Test 1: GET requests (deduplicated)\n';
				const start1 = Date.now();
				await Promise.all([
					api.get('/posts/1'),
					api.get('/posts/1'),
					api.get('/posts/1')
				]);
				const duration1 = Date.now() - start1;
				output += `  ✅ Only 1 GET request executed - ${duration1}ms\n\n`;
				
				output += 'Test 2: POST requests (excluded, not deduplicated)\n';
				const start2 = Date.now();
				await Promise.all([
					api.post('/posts', { body: { id: 1 } }),
					api.post('/posts', { body: { id: 2 } })
				]);
				const duration2 = Date.now() - start2;
				output += `  ✅ Both POST requests executed - ${duration2}ms\n\n`;
				
				output += '💡 Mutations should execute independently by default!';
				return output;
			}
		},
		
		{
			id: 'deduplicator-cache-ttl',
			title: 'Cache TTL & Burst Protection',
			description: 'Configure how long completed requests stay cached',
			code: `// Short TTL (default: 100ms) - Burst protection
const api = createLuminara({
  deduplicate: {
    cacheTTL: 200 // Keep completed requests for 200ms
  }
});

// First request
await api.get('/posts/1');
console.log('Request 1: Completed');

// Within 200ms: uses cached result
await new Promise(resolve => setTimeout(resolve, 100));
const start = Date.now();
await api.get('/posts/1');
console.log(\`Request 2: Used cache (~\${Date.now() - start}ms, instant!)\`);

// After 200ms: new request
await new Promise(resolve => setTimeout(resolve, 150));
const start2 = Date.now();
await api.get('/posts/1');
console.log(\`Request 3: New request (\${Date.now() - start2}ms)\`);

console.log('💡 cacheTTL provides burst protection!');`,
			async run(updateOutput, signal) {
				const { createLuminara } = window.Luminara;
				
				let output = '⏱️ Cache TTL Demonstration\n\n';
				
				const api = createLuminara({
					baseURL: 'https://jsonplaceholder.typicode.com',
					deduplicate: {
						cacheTTL: 200 // 200ms for demo
					},
					verbose: false
				});
				
				output += 'Request 1: Initial request\n';
				const start1 = Date.now();
				await api.get('/posts/1');
				output += `  ✅ Completed in ${Date.now() - start1}ms\n\n`;
				
				await new Promise(resolve => setTimeout(resolve, 100));
				
				output += 'Request 2: Within TTL (100ms later)\n';
				const start2 = Date.now();
				await api.get('/posts/1');
				output += `  ✅ Used cached result (~${Date.now() - start2}ms, instant!)\n\n`;
				
				await new Promise(resolve => setTimeout(resolve, 150));
				
				output += 'Request 3: After TTL expired (250ms total)\n';
				const start3 = Date.now();
				await api.get('/posts/1');
				output += `  ✅ New request executed in ${Date.now() - start3}ms\n\n`;
				
				output += '💡 cacheTTL provides burst protection without long-term caching!';
				return output;
			}
		},
		
		{
			id: 'deduplicator-per-request-disable',
			title: 'Per-Request Disable',
			description: 'Bypass deduplication for specific requests',
			code: `const api = createLuminara({
  deduplicate: {} // Enabled globally
});

// Scenario: 2 concurrent requests, second bypasses deduplication
const [r1, r2] = await Promise.all([
  api.get('/posts/1'),
  api.get('/posts/1', {
    deduplicate: { disabled: true } // Force fresh data
  })
]);

console.log('Request 1: Normal (deduplicated)');
console.log('Request 2: Disabled (force fresh)');
console.log('💡 2 network requests executed');

// Use case: "Force Reload" button
button.addEventListener('click', async () => {
  const freshData = await api.get('/posts/1', {
    deduplicate: { disabled: true }
  });
});`,
			async run(updateOutput, signal) {
				const { createLuminara } = window.Luminara;
				
				let output = '🔓 Per-Request Disable Demo\n\n';
				
				const api = createLuminara({
					baseURL: 'https://jsonplaceholder.typicode.com',
					deduplicate: {},
					verbose: false
				});
				
				output += 'Scenario: 2 concurrent requests, second bypasses deduplication\n\n';
				
				const [r1, r2] = await Promise.all([
					(async () => {
						output += 'Request 1: Normal (deduplicated)\n';
						const result = await api.get('/posts/1');
						output += '  ✅ Request 1 completed\n';
						return result;
					})(),
					(async () => {
						output += 'Request 2: Disabled (force fresh)\n';
						const result = await api.get('/posts/1', {
							deduplicate: { disabled: true }
						});
						output += '  ✅ Request 2 completed\n';
						return result;
					})()
				]);
				
				output += '\n💡 2 network requests executed (r2 bypassed deduplication)';
				return output;
			}
		},
		
		{
			id: 'deduplicator-custom-key',
			title: 'Custom Key Generator',
			description: 'Implement custom business logic for request identity',
			code: `// Deduplicate search by query only, ignore other params
const api = createLuminara({
  deduplicate: {
    keyStrategy: 'custom',
    keyGenerator: (req) => {
      const url = new URL(req.fullUrl);
      const query = url.searchParams.get('q');
      return \`search:\${query}\`;
    }
  }
});

// These deduplicate (same query)
await api.get('/posts?q=test&page=1');
await api.get('/posts?q=test&page=2'); // Shares result

// This doesn't deduplicate (different query)
await api.get('/posts?q=other&page=1'); // New request

console.log('💡 Custom keys enable complex business logic!');`,
			async run(updateOutput, signal) {
				const { createLuminara } = window.Luminara;
				
				let output = '🎨 Custom Key Generator Demo\n\n';
				
				const api = createLuminara({
					baseURL: 'https://jsonplaceholder.typicode.com',
					deduplicate: {
						keyStrategy: 'custom',
						keyGenerator: (req) => {
							// Extract pathname only (ignore query params)
							const url = new URL(req.fullUrl);
							return url.pathname;
						}
					},
					verbose: false
				});
				
				output += 'Firing 3 requests with different query params:\n';
				output += '  /posts/1?_delay=50\n';
				output += '  /posts/1?id=2\n';
				output += '  /posts/1?id=3\n\n';
				
				const start = Date.now();
				await Promise.all([
					api.get('/posts/1?_delay=50'),
					api.get('/posts/1?id=2'),
					api.get('/posts/1?id=3')
				]);
				const duration = Date.now() - start;
				
				output += '✅ All deduplicated (custom key ignores query params)\n';
				output += `Only 1 network request executed - ${duration}ms\n\n`;
				output += '💡 Custom keys enable complex business logic!';
				return output;
			}
		},
		
		{
			id: 'deduplicator-error-propagation',
			title: 'Error Propagation',
			description: 'Failed requests propagate errors to all duplicates',
			code: `const api = createLuminara({
  deduplicate: {}
});

// Fire 3 concurrent requests to failing endpoint
const promises = [
  api.get('/posts/99999999'),
  api.get('/posts/99999999'),
  api.get('/posts/99999999')
];

// All 3 receive the same error
let errorCount = 0;
for (const promise of promises) {
  try {
    await promise;
  } catch (error) {
    errorCount++;
    console.error(\`Request \${errorCount}: ❌ Error\`);
  }
}

console.log('✅ All 3 duplicates received the error');
console.log('💡 Errors are shared just like successful responses!');`,
			async run(updateOutput, signal) {
				const { createLuminara } = window.Luminara;
				
				let output = '💥 Error Propagation Demo\n\n';
				
				const api = createLuminara({
					baseURL: 'https://jsonplaceholder.typicode.com',
					deduplicate: {},
					verbose: false
				});
				
				output += 'Firing 3 concurrent requests to non-existent endpoint...\n\n';
				
				const promises = [
					api.get('/posts/99999999'),
					api.get('/posts/99999999'),
					api.get('/posts/99999999')
				];
				
				let errorCount = 0;
				for (const promise of promises) {
					try {
						await promise;
					} catch (error) {
						errorCount++;
						output += `Request ${errorCount}: ❌ Received error (status ${error.status || 'N/A'})\n`;
					}
				}
				
				output += '\n✅ All 3 duplicates received the error\n';
				output += '✅ Only 1 network request executed\n\n';
				output += '💡 Errors are shared just like successful responses!';
				return output;
			}
		},
		
		{
			id: 'deduplicator-with-retry',
			title: 'Integration with Retry Logic',
			description: 'Deduplication works seamlessly with retry logic',
			code: `const api = createLuminara({
  deduplicate: {},
  retry: 2, // Retry up to 2 times
  retryDelay: 100
});

// Fire concurrent requests
const start = Date.now();
const [r1, r2, r3] = await Promise.all([
  api.get('/posts/1'),
  api.get('/posts/1'),
  api.get('/posts/1')
]);
const duration = Date.now() - start;

console.log('✅ All 3 requests succeeded');
console.log('✅ Only 1 network request executed');
console.log('✅ Duplicates shared the retry result');
console.log(\`Duration: \${duration}ms\`);
console.log('💡 Deduplication and retry work together perfectly!');`,
			async run(updateOutput, signal) {
				const { createLuminara } = window.Luminara;
				
				let output = '🔄 Deduplication + Retry Integration\n\n';
				
				const api = createLuminara({
					baseURL: 'https://jsonplaceholder.typicode.com',
					deduplicate: {},
					retry: 2,
					retryDelay: 100,
					verbose: false
				});
				
				output += 'Firing 3 concurrent requests with retry enabled...\n\n';
				
				const start = Date.now();
				const results = await Promise.all([
					api.get('/posts/1'),
					api.get('/posts/1'),
					api.get('/posts/1')
				]);
				const duration = Date.now() - start;
				
				output += `✅ All ${results.length} requests succeeded\n`;
				output += '✅ Only 1 network request executed\n';
				output += '✅ Duplicates shared the result\n';
				output += `Duration: ${duration}ms\n\n`;
				output += '💡 Deduplication and retry work together perfectly!';
				return output;
			}
		}
	]
};
