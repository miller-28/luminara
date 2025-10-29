import { createLuminara } from '../../src/index.js';
import { TestSuite, MockServer, assert, assertEqual } from '../testUtils.js';

const suite = new TestSuite('Enhanced Interceptors');
const mockServer = new MockServer(3009);

// Test enhanced interceptor system functionality
suite.test('Deterministic execution order L→R for onRequest', async () => {
	const executionOrder = [];
	const api = createLuminara();

	// Register three interceptors in order
	api.use({
		onRequest(context) {
			executionOrder.push('interceptor-1');
		}
	});

	api.use({
		onRequest(context) {
			executionOrder.push('interceptor-2');
		}
	});

	api.use({
		onRequest(context) {
			executionOrder.push('interceptor-3');
		}
	});

	// Mock driver to avoid actual HTTP call
	api.driver = {
		request: async () => ({ status: 200, headers: new Headers(), data: { success: true } })
	};

	await api.getJson('https://example.com/test');

	assertEqual(executionOrder, ['interceptor-1', 'interceptor-2', 'interceptor-3'], 'onRequest should execute L→R');
});

suite.test('Deterministic execution order R→L for onResponse', async () => {
	const executionOrder = [];
	const api = createLuminara();

	// Register three interceptors in order
	api.use({
		onResponse(context) {
			executionOrder.push('interceptor-1');
		}
	});

	api.use({
		onResponse(context) {
			executionOrder.push('interceptor-2');
		}
	});

	api.use({
		onResponse(context) {
			executionOrder.push('interceptor-3');
		}
	});

	// Mock driver to avoid actual HTTP call
	api.driver = {
		request: async () => ({ status: 200, headers: new Headers(), data: { success: true } })
	};

	await api.getJson('https://example.com/test');

	assertEqual(executionOrder, ['interceptor-3', 'interceptor-2', 'interceptor-1'], 'onResponse should execute R→L');
});

suite.test('Mutable context shared between interceptors', async () => {
	const api = createLuminara();
	let finalContextState = null;

	// First interceptor adds metadata
	api.use({
		onRequest(context) {
			context.meta.sharedData = 'from-first-interceptor';
			context.meta.counter = 1;
		}
	});

	// Second interceptor modifies shared metadata
	api.use({
		onRequest(context) {
			assert(context.meta.sharedData === 'from-first-interceptor', 'Should access data from first interceptor');
			context.meta.sharedData = 'modified-by-second';
			context.meta.counter += 1;
		}
	});

	// Third interceptor validates and captures final state
	api.use({
		onRequest(context) {
			assert(context.meta.sharedData === 'modified-by-second', 'Should access modified data');
			assert(context.meta.counter === 2, 'Should have incremented counter');
			context.meta.finalValue = 'all-interceptors-processed';
		},
		onResponse(context) {
			finalContextState = { ...context.meta };
		}
	});

	// Mock driver
	api.driver = {
		request: async () => ({ status: 200, headers: new Headers(), data: { success: true } })
	};

	await api.getJson('https://example.com/test');

	assert(finalContextState !== null, 'Should capture final context state');
	assert(finalContextState.finalValue === 'all-interceptors-processed', 'Should preserve final value');
});

suite.test('Retry-aware authentication with fresh tokens', async () => {
	const authTokens = [];
	let tokenRefreshCount = 0;
	let driverCallCount = 0;

	const api = createLuminara({ retry: 1 });

	// Add authentication interceptor that refreshes on each attempt
	api.use({
		onRequest(context) {
			// Simulate token refresh on each request attempt
			const newToken = context.attempt === 1 ? 'expired-token' : `fresh-token-${context.attempt - 1}`;
			
			if (context.attempt > 1) {
				tokenRefreshCount++;
			}
			
			authTokens.push(newToken);
			context.req.headers = {
				...context.req.headers,
				Authorization: `Bearer ${newToken}`
			};
		}
	});

	// Mock driver that fails with expired token, succeeds with fresh token
	api.driver = {
		request: async (req) => {
			driverCallCount++;
			
			if (req.headers.Authorization === 'Bearer expired-token') {
				// Simulate auth failure with expired token
				const error = new Error('Unauthorized');
				error.status = 401;
				error.statusText = 'Unauthorized';
				throw error;
			}
			
			// Success with fresh token
			return { status: 200, headers: new Headers(), data: { authenticated: true } };
		}
	};

	const response = await api.getJson('https://example.com/test');

	assertEqual(authTokens, ['expired-token', 'fresh-token-1'], 'Should use expired token first, then fresh token');
	assert(tokenRefreshCount === 1, 'Should refresh token once');
	assert(driverCallCount === 2, 'Should make 2 driver calls (initial + 1 retry)');
	assert(response.data.authenticated === true, 'Should succeed with fresh token');
});

suite.test('AbortController accessible in context', async () => {
	const api = createLuminara();
	let capturedController = null;

	api.use({
		onRequest(context) {
			capturedController = context.controller;
			assert(capturedController instanceof AbortController, 'Should provide AbortController instance');
		}
	});

	// Mock driver that checks for abort signal in request options
	api.driver = {
		request: async (req) => {
			assert(req.signal === capturedController.signal, 'Driver should receive abort signal in request object');
			return { status: 200, headers: new Headers(), data: { success: true } };
		}
	};

	await api.getJson('https://example.com/test');
});

suite.test('AbortController can cancel requests', async () => {
	const api = createLuminara();
	let requestAborted = false;

	api.use({
		onRequest(context) {
			// Cancel the request immediately
			setTimeout(() => context.controller.abort(), 10);
		}
	});

	// Mock driver that simulates delay and checks for abort
	api.driver = {
		request: async (req) => {
			const signal = req.signal;
			return new Promise((resolve, reject) => {
				const timeout = setTimeout(() => {
					resolve({ status: 200, headers: new Headers(), data: { success: true } });
				}, 100);

				signal.addEventListener('abort', () => {
					clearTimeout(timeout);
					requestAborted = true;
					reject(new Error('Request aborted'));
				});
			});
		}
	};

	try {
		await api.getJson('https://example.com/test');
		assert(false, 'Request should have been aborted');
	} catch (error) {
		assert(requestAborted === true, 'Request should be marked as aborted');
		assert(error.message === 'Request aborted', 'Should throw abort error');
	}
});

suite.test('Backward compatibility with legacy plugin API', async () => {
	const api = createLuminara();
	let onSuccessCalled = false;
	let transformedResponse = null;

	// Legacy plugin using onSuccess
	api.use({
		onSuccess(response, request) {
			onSuccessCalled = true;
			console.log('onSuccess called with response:', response);
			const transformed = {
				...response,
				data: {
					...response.data,
					legacyProcessed: true
				}
			};
			console.log('onSuccess returning:', transformed);
			return transformed;
		}
	});

	// Modern interceptor to capture final result
	api.use({
		onResponse(context) {
			console.log('onResponse called with context.res:', context.res);
			transformedResponse = context.res;
		}
	});

	// Mock driver
	api.driver = {
		request: async () => ({ status: 200, headers: new Headers(), data: { original: true } })
	};

	await api.getJson('https://example.com/test');

	console.log('Final transformedResponse:', transformedResponse);
	assert(onSuccessCalled === true, 'Legacy onSuccess should be called');
	assert(transformedResponse.data.legacyProcessed === true, 'Legacy transformation should be applied');
	assert(transformedResponse.data.original === true, 'Original data should be preserved');
});

suite.test('Error handling with onResponseError interceptors', async () => {
	const api = createLuminara();
	let errorIntercepted = false;
	let errorTransformed = false;

	api.use({
		onResponseError(context) {
			errorIntercepted = true;
			assert(context.error.message === 'Server Error', 'Should receive original error');
			
			// Transform error
			context.error = new Error('Transformed error message');
			errorTransformed = true;
		}
	});

	// Mock driver that throws error
	api.driver = {
		request: async () => {
			throw new Error('Server Error');
		}
	};

	try {
		await api.getJson('https://example.com/test');
		assert(false, 'Should have thrown error');
	} catch (error) {
		assert(errorIntercepted === true, 'Error should be intercepted');
		assert(errorTransformed === true, 'Error should be transformed');
		assert(error.message === 'Transformed error message', 'Should throw transformed error');
	}
});

// Export for test runner
export { suite, mockServer };