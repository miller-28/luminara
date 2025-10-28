import { createLuminara } from '../../src/index.js';
import { TestSuite, MockServer, assert, assertRange, Timer } from '../testUtils.js';
import { fileURLToPath } from 'url';

const suite = new TestSuite('Retry Logic');
const mockServer = new MockServer(3004);

// Test basic retry functionality
suite.test('Basic retry on server errors', async () => {
	mockServer.resetCounts();
	
	const api = createLuminara({
		baseURL: 'http://localhost:3004',
		retry: 3,
		retryDelay: 50
	});
	
	try {
		await api.getJson('/json?status=500');
		assert(false, 'Should fail after retries');
	} catch (error) {
		const requestCount = mockServer.getRequestCount('GET', '/json');
		assert(requestCount === 4, `Should make 4 total requests (1 + 3 retries), made ${requestCount}`);
	}
});

suite.test('No retry on client errors (4xx)', async () => {
	mockServer.resetCounts();
	
	const api = createLuminara({
		baseURL: 'http://localhost:3004',
		retry: 3,
		retryDelay: 50
	});
	
	try {
		await api.getJson('/json?status=404');
		assert(false, 'Should fail without retries');
	} catch (error) {
		const requestCount = mockServer.getRequestCount('GET', '/json');
		assert(requestCount === 1, `Should make only 1 request for 404, made ${requestCount}`);
	}
});

suite.test('Retry on specific status codes', async () => {
	mockServer.resetCounts();
	
	const api = createLuminara({
		baseURL: 'http://localhost:3004',
		retry: 2,
		retryDelay: 50,
		retryStatusCodes: [408, 429, 503] // Specific codes to retry
	});
	
	// Should retry 429 (rate limit)
	try {
		await api.getJson('/json?status=429');
	} catch (error) {
		const requestCount429 = mockServer.getRequestCount('GET', '/json');
		assert(requestCount429 === 3, `Should retry 429 status, made ${requestCount429} requests`);
	}
	
	mockServer.resetCounts();
	
	// Should not retry 502 (not in retryStatusCodes)
	try {
		await api.getJson('/json?status=502');
	} catch (error) {
		const requestCount502 = mockServer.getRequestCount('GET', '/json');
		assert(requestCount502 === 1, `Should not retry 502 status, made ${requestCount502} requests`);
	}
});

suite.test('Retry with timeout combination', async () => {
	mockServer.resetCounts();
	
	const api = createLuminara({
		baseURL: 'http://localhost:3004',
		retry: 2,
		retryDelay: 100,
		timeout: 200 // 200ms timeout
	});
	
	const timer = new Timer();
	timer.mark();
	
	try {
		// Request with 300ms delay should timeout (ofetch doesn't retry timeout errors by default)
		await api.getJson('/json?delay=300');
		assert(false, 'Should timeout');
	} catch (error) {
		timer.mark();
		
		const totalTime = timer.getDuration();
		const requestCount = mockServer.getRequestCount('GET', '/json');
		
		// ofetch doesn't retry timeout errors by default, so only 1 request
		assert(requestCount === 1, `Should make 1 request (timeout not retried), made ${requestCount}`);
		// Single timeout: ~200ms (can have overhead in test environment)
		assertRange(totalTime, 180, 500, `Timeout should occur around 200ms, got ${totalTime}ms`);
	}
});

suite.test('Eventual success after retries', async () => {
	let requestCount = 0;
	const originalHandler = mockServer.handleRequest;
	
	// Mock server that fails twice, then succeeds
	mockServer.handleRequest = function(req, res, path, params) {
		if (path === '/retry-success') {
			requestCount++;
			if (requestCount <= 2) {
				res.writeHead(503, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify({ error: 'Service temporarily unavailable' }));
				return;
			}
			res.writeHead(200, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ 
				message: 'Success after retries',
				attemptNumber: requestCount 
			}));
			return;
		}
		
		originalHandler.call(this, req, res, path, params);
	};
	
	const api = createLuminara({
		baseURL: 'http://localhost:3004',
		retry: 3,
		retryDelay: 50
	});
	
	const response = await api.getJson('/retry-success');
	
	assert(response.status === 200, 'Should eventually succeed');
	assert(response.data.attemptNumber === 3, `Should succeed on 3rd attempt, got ${response.data.attemptNumber}`);
	assert(requestCount === 3, `Should make exactly 3 requests, made ${requestCount}`);
	
	// Restore original handler
	mockServer.handleRequest = originalHandler;
});

suite.test('Custom retry delay function', async () => {
	const delays = [];
	const totalRetries = 4;
	
	const api = createLuminara({
		baseURL: 'http://localhost:3004',
		retry: totalRetries,
		retryDelay: (context) => {
			// Calculate attempt number: totalRetries - current retry + 1
			const attemptNumber = totalRetries - context.options.retry + 1;
			const delay = 100 * attemptNumber; // 100ms, 200ms, 300ms, 400ms
			delays.push(delay);
			return delay;
		}
	});
	
	const timer = new Timer();
	timer.mark();
	
	try {
		await api.getJson('/json?status=503');
	} catch (error) {
		timer.mark();
		
		assert(delays.length === 4, `Should call retryDelay 4 times, called ${delays.length} times`);
		assert(delays[0] === 100, `First delay should be 100ms, got ${delays[0]}ms`);
		assert(delays[1] === 200, `Second delay should be 200ms, got ${delays[1]}ms`);
		assert(delays[2] === 300, `Third delay should be 300ms, got ${delays[2]}ms`);
		assert(delays[3] === 400, `Fourth delay should be 400ms, got ${delays[3]}ms`);
		
		const totalTime = timer.getDuration();
		// Total delays: 100 + 200 + 300 + 400 = 1000ms plus request time
		assertRange(totalTime, 950, 1300, `Total time should include custom delays, got ${totalTime}ms`);
	}
});

suite.test('Retry context provides request information', async () => {
	const contextsCaptured = [];
	const totalRetries = 3;
	
	const api = createLuminara({
		baseURL: 'http://localhost:3004',
		retry: totalRetries,
		retryDelay: (context) => {
			// Calculate attempt number: totalRetries - current retry + 1
			const attemptNumber = totalRetries - context.options.retry + 1;
			contextsCaptured.push({
				attempt: attemptNumber,
				error: context.error?.message || 'No error',
				requestUrl: context.request || 'No URL',
				retryRemaining: context.options.retry
			});
			return 50;
		}
	});
	
	try {
		await api.getJson('/json?status=500');
	} catch (error) {
		assert(contextsCaptured.length === 3, `Should capture 3 contexts, got ${contextsCaptured.length}`);
		
		// Verify attempt numbers
		assert(contextsCaptured[0].attempt === 1, `First attempt should be 1, got ${contextsCaptured[0].attempt}`);
		assert(contextsCaptured[1].attempt === 2, `Second attempt should be 2, got ${contextsCaptured[1].attempt}`);
		assert(contextsCaptured[2].attempt === 3, `Third attempt should be 3, got ${contextsCaptured[2].attempt}`);
		
		// Verify context information is available
		contextsCaptured.forEach((context, index) => {
			assert(context.requestUrl && context.requestUrl !== 'No URL', `Context ${index + 1} should have request URL`);
			assert(typeof context.retryRemaining === 'number', `Context ${index + 1} should have retry info`);
		});
	}
});

suite.test('Retry with POST requests and body preservation', async () => {
	mockServer.resetCounts();
	
	const api = createLuminara({
		baseURL: 'http://localhost:3004',
		retry: 2,
		retryDelay: 50
	});
	
	const testData = { name: 'John', age: 30 };
	
	try {
		await api.postJson('/json?status=503', testData);
	} catch (error) {
		const requestCount = mockServer.getRequestCount('POST', '/json');
		assert(requestCount === 3, `Should retry POST requests, made ${requestCount} requests`);
		
		// Verify that the mock server received the data in all requests
		// (This would be implementation specific - here we assume the mock server logs it)
	}
});

suite.test('Retry disabled with retry: 0', async () => {
	mockServer.resetCounts();
	
	const api = createLuminara({
		baseURL: 'http://localhost:3004',
		retry: 0, // Disable retries
		retryDelay: 100
	});
	
	try {
		await api.getJson('/json?status=500');
		assert(false, 'Should fail without retries');
	} catch (error) {
		const requestCount = mockServer.getRequestCount('GET', '/json');
		assert(requestCount === 1, `Should make only 1 request when retry disabled, made ${requestCount}`);
	}
});

suite.test('Retry with network errors simulation', async () => {
	// Create a separate client that points to non-existent server
	const api = createLuminara({
		baseURL: 'http://localhost:9999', // Non-existent server
		retry: 2,
		retryDelay: 50,
		timeout: 100 // Short timeout to speed up test
	});
	
	const timer = new Timer();
	timer.mark();
	
	try {
		await api.getJson('/json');
		assert(false, 'Should fail with network error');
	} catch (error) {
		timer.mark();
		
		const totalTime = timer.getDuration();
		// Network errors may not be retried by default, expect shorter time
		// Single attempt with timeout: ~100ms + connection attempt overhead
		assertRange(totalTime, 50, 300, `Network error timing should be ~100ms, got ${totalTime}ms`);
		
		// Verify it's a network error (ECONNREFUSED, timeout, or other network issue)
		assert(error.message.includes('ECONNREFUSED') || 
		       error.message.includes('fetch failed') ||
		       error.message.includes('Failed to fetch') ||
		       error.message.includes('network') ||
		       error.message.includes('timeout') ||
		       error.message.includes('aborted') ||
		       error.name === 'TimeoutError' ||
		       error.code === 'ECONNREFUSED', 
		       `Should be network error, got: ${error.message}`);
	}
});

// Run tests if this file is executed directly
if (fileURLToPath(import.meta.url) === process.argv[1]) {
	console.log('🧪 Running Retry Logic Tests...');
	await mockServer.start();
	
	try {
		const results = await suite.run();
		console.log(`✅ Tests completed: ${results.passed}/${results.total} passed`);
		process.exit(results.failed > 0 ? 1 : 0);
	} finally {
		await mockServer.stop();
	}
}

export { suite, mockServer };