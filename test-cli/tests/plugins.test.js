import { createLuminara } from '../../src/index.js';
import { TestSuite, MockServer, assert, assertEqual } from '../testUtils.js';
import { fileURLToPath } from 'url';

const suite = new TestSuite('Plugin System');
const mockServer = new MockServer(4203);

// Test plugin lifecycle hooks
suite.test('Plugin onRequest hook modifies requests', async () => {
	let requestCaptured = null;
	
	const api = createLuminara({
		baseURL: 'http://localhost:4203'
	});
	
	// Add plugin that modifies requests
	api.use({
		onRequest(request) {
			requestCaptured = { ...request };
			// Add custom header
			return {
				...request,
				headers: {
					...request.headers,
					'X-Plugin-Modified': 'true',
					'X-Custom-Token': 'abc123'
				}
			};
		}
	});
	
	await api.getJson('/json');
	
	assert(requestCaptured !== null, 'Plugin should capture request');
	assert(requestCaptured.method === 'GET', 'Should capture correct method');
	assert(requestCaptured.url.includes('/json'), 'Should capture correct URL');
});

suite.test('Plugin onSuccess hook modifies responses', async () => {
	let originalResponse = null;
	let modifiedResponse = null;
	
	const api = createLuminara({
		baseURL: 'http://localhost:4203'
	});
	
	api.use({
		onSuccess(response, request) {
			originalResponse = response;
			// Add metadata to response
			return {
				...response,
				data: {
					...response.data,
					_metadata: {
						processedBy: 'plugin',
						timestamp: Date.now(),
						requestId: 'req-123'
					}
				}
			};
		}
	});
	
	modifiedResponse = await api.getJson('/json');
	
	assert(originalResponse !== null, 'Plugin should capture original response');
	assert(modifiedResponse.data._metadata !== undefined, 'Plugin should add metadata');
	assert(modifiedResponse.data._metadata.processedBy === 'plugin', 'Should add correct metadata');
	assert(modifiedResponse.data.message === 'Success', 'Should preserve original data');
});

suite.test('Plugin onError hook handles errors', async () => {
	let errorCaptured = null;
	let requestCaptured = null;
	
	const api = createLuminara({
		baseURL: 'http://localhost:4203',
		retry: 0 // Disable retries for clean error testing
	});
	
	api.use({
		onError(error, request) {
			errorCaptured = error;
			requestCaptured = request;
			// Transform error
			const newError = new Error(`Plugin transformed: ${error.message}`);
			newError.originalError = error;
			newError.pluginProcessed = true;
			throw newError;
		}
	});
	
	try {
		await api.getJson('/json?status=500');
		assert(false, 'Should have thrown an error');
	} catch (error) {
		assert(errorCaptured !== null, 'Plugin should capture error');
		assert(requestCaptured !== null, 'Plugin should capture request');
		assert(error.pluginProcessed === true, 'Error should be processed by plugin');
		assert(error.message.includes('Plugin transformed'), 'Error message should be transformed');
	}
});

suite.test('Multiple plugins chain correctly', async () => {
	const executionOrder = [];
	
	const api = createLuminara({
		baseURL: 'http://localhost:4203'
	});
	
	// First plugin
	api.use({
		onRequest(request) {
			executionOrder.push('plugin1-request');
			return {
				...request,
				headers: { ...request.headers, 'X-Plugin-1': 'true' }
			};
		},
		onSuccess(response) {
			executionOrder.push('plugin1-success');
			return {
				...response,
				data: { ...response.data, plugin1: 'processed' }
			};
		}
	});
	
	// Second plugin
	api.use({
		onRequest(request) {
			executionOrder.push('plugin2-request');
			return {
				...request,
				headers: { ...request.headers, 'X-Plugin-2': 'true' }
			};
		},
		onSuccess(response) {
			executionOrder.push('plugin2-success');
			return {
				...response,
				data: { ...response.data, plugin2: 'processed' }
			};
		}
	});
	
	const response = await api.getJson('/json');
	
	// Verify execution order
	assertEqual(executionOrder, [
		'plugin1-request',
		'plugin2-request',
		'plugin1-success',
		'plugin2-success'
	], 'Plugins should execute in correct order');
	
	// Verify both plugins processed response
	assert(response.data.plugin1 === 'processed', 'Plugin 1 should process response');
	assert(response.data.plugin2 === 'processed', 'Plugin 2 should process response');
});

suite.test('Plugin can prevent request execution', async () => {
	let requestPrevented = false;
	
	const api = createLuminara({
		baseURL: 'http://localhost:4203'
	});
	
	api.use({
		onRequest(request) {
			if (request.url.includes('forbidden')) {
				requestPrevented = true;
				const error = new Error('Request blocked by plugin');
				error.statusCode = 403;
				throw error;
			}
			return request;
		}
	});
	
	try {
		await api.getJson('/forbidden-endpoint');
		assert(false, 'Should have blocked the request');
	} catch (error) {
		assert(requestPrevented, 'Plugin should prevent request');
		assert(error.message === 'Request blocked by plugin', 'Should throw plugin error');
		assert(error.statusCode === 403, 'Should set correct status code');
	}
});

suite.test('Authentication plugin pattern', async () => {
	let authHeaderAdded = false;
	let tokenRefreshed = false;
	
	// Simulate auth plugin
	const authPlugin = {
		onRequest(request) {
			authHeaderAdded = true;
			return {
				...request,
				headers: {
					...request.headers,
					'Authorization': 'Bearer mock-jwt-token'
				}
			};
		},
		
		onError(error, request) {
			if (error.status === 401) {
				tokenRefreshed = true;
				// In real app, would refresh token here
				const refreshedError = new Error('Token refreshed, retry needed');
				refreshedError.shouldRetry = true;
				throw refreshedError;
			}
			throw error;
		}
	};
	
	const api = createLuminara({
		baseURL: 'http://localhost:4203',
		retry: 0
	});
	
	api.use(authPlugin);
	
	// Test successful auth
	const response = await api.getJson('/json');
	assert(authHeaderAdded, 'Auth header should be added');
	assert(response.status === 200, 'Request should succeed with auth');
	
	// Test auth failure
	authHeaderAdded = false;
	try {
		await api.getJson('/json?status=401');
	} catch (error) {
		assert(authHeaderAdded, 'Auth header should be added even for failed requests');
		assert(tokenRefreshed, 'Should attempt token refresh on 401');
	}
});

suite.test('Logging plugin pattern', async () => {
	const logs = [];
	
	const loggingPlugin = {
		onRequest(request) {
			logs.push({
				type: 'request',
				method: request.method,
				url: request.url,
				timestamp: Date.now()
			});
			return request;
		},
		
		onSuccess(response, request) {
			logs.push({
				type: 'success',
				status: response.status,
				url: request.url,
				duration: Date.now() - logs[logs.length - 1].timestamp
			});
			return response;
		},
		
		onError(error, request) {
			logs.push({
				type: 'error',
				error: error.message,
				url: request.url,
				duration: Date.now() - logs[logs.length - 1].timestamp
			});
			throw error;
		}
	};
	
	const api = createLuminara({
		baseURL: 'http://localhost:4203',
		retry: 0
	});
	
	api.use(loggingPlugin);
	
	// Successful request
	await api.getJson('/json');
	
	// Failed request
	try {
		await api.getJson('/json?status=500');
	} catch (error) {
		// Expected to fail
	}
	
	assert(logs.length === 4, `Should have 4 log entries, got ${logs.length}`);
	assert(logs[0].type === 'request', 'First log should be request');
	assert(logs[1].type === 'success', 'Second log should be success');
	assert(logs[2].type === 'request', 'Third log should be request');
	assert(logs[3].type === 'error', 'Fourth log should be error');
	
	// Verify timing information
	assert(logs[1].duration >= 0, 'Success log should have duration');
	assert(logs[3].duration >= 0, 'Error log should have duration');
});

suite.test('Caching plugin pattern simulation', async () => {
	const cache = new Map();
	let cacheHits = 0;
	let cacheMisses = 0;
	
	const cachingPlugin = {
		onRequest(request) {
			// Only cache GET requests
			if (request.method === 'GET') {
				const cacheKey = `${request.method}:${request.url}`;
				if (cache.has(cacheKey)) {
					cacheHits++;
					// Add a flag to indicate this should use cache
					return {
						...request,
						_useCache: true,
						_cacheKey: cacheKey
					};
				}
				cacheMisses++;
			}
			return request;
		},
		
		onSuccess(response, request) {
			// Check if we should return cached response
			if (request._useCache) {
				const cachedResponse = cache.get(request._cacheKey);
				return {
					...cachedResponse,
					fromCache: true
				};
			}
			
			// Cache successful GET responses
			if (request.method === 'GET' && response.status === 200) {
				const cacheKey = `${request.method}:${request.url}`;
				cache.set(cacheKey, { ...response });
			}
			return response;
		}
	};
	
	const api = createLuminara({
		baseURL: 'http://localhost:4203'
	});
	
	api.use(cachingPlugin);
	
	// First request - cache miss
	const response1 = await api.getJson('/json');
	assert(cacheMisses === 1, 'Should have 1 cache miss');
	assert(cacheHits === 0, 'Should have 0 cache hits');
	assert(!response1.fromCache, 'First response should not be from cache');
	
	// Second request - cache hit
	const response2 = await api.getJson('/json');
	assert(cacheMisses === 1, 'Should still have 1 cache miss');
	assert(cacheHits === 1, 'Should have 1 cache hit');
	assert(response2.fromCache === true, 'Second response should be from cache');
	
	// Different URL - cache miss
	const response3 = await api.getJson('/json?param=test');
	assert(cacheMisses === 2, 'Should have 2 cache misses');
	assert(cacheHits === 1, 'Should still have 1 cache hit');
	assert(!response3.fromCache, 'Different URL should not be from cache');
});

// Run tests if this file is executed directly
if (fileURLToPath(import.meta.url) === process.argv[1]) {
	console.log('🧪 Running Plugin System Tests...');
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
