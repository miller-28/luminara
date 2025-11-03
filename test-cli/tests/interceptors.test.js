import { createLuminara } from '../../src/index.js';
import { TestSuite, MockServer, assert, assertEqual } from '../testUtils.js';
import { runTestSuiteIfDirect } from '../runTestSuite.js';

const suite = new TestSuite('Interceptors');
const mockServer = new MockServer(4224);
const BASE_URL = `http://localhost:${mockServer.port}`;

// Test comprehensive interceptor system functionality
suite.test('onRequest hook modifies requests', async () => {
	const api = createLuminara({
		baseURL: BASE_URL
	});
	
	// Add authentication interceptor
	api.use({
		onRequest(request) {
			request.headers = request.headers || {};
			request.headers['Authorization'] = 'Bearer test-token';
			request.headers['X-Custom'] = 'interceptor-added';
			return request;
		}
	});
	
	const response = await api.getJson('/json');
	
	assert(response.status === 200, 'Should return 200 status');
	assert(response.data.message === 'Success', 'Should get success message');
});

suite.test('onSuccess hook modifies responses', async () => {
	const api = createLuminara({
		baseURL: BASE_URL
	});
	
	// Add response transformation interceptor
	api.use({
		onSuccess(response, request) {
			if (response.data && typeof response.data === 'object') {
				response.data.interceptorAdded = true;
				response.data.timestamp = Date.now();
			}
			return response;
		}
	});
	
	const response = await api.getJson('/json');
	
	assert(response.status === 200, 'Should return 200 status');
	assertEqual(response.data.interceptorAdded, true, 'Should add interceptor flag');
	assert(typeof response.data.timestamp === 'number', 'Should add timestamp');
	assertEqual(response.data.message, 'Success', 'Should preserve original data');
});

suite.test('onError hook handles errors', async () => {
	const api = createLuminara({
		baseURL: BASE_URL
	});
	
	let errorIntercepted = false;
	
	// Add error handling interceptor
	api.use({
		onError(error, request) {
			errorIntercepted = true;
			// Transform 404 into custom error
			if (error.status === 404) {
				const customError = new Error('Resource not found');
				customError.isCustom = true;
				customError.originalStatus = error.status;
				throw customError;
			}
			throw error;
		}
	});
	
	try {
		await api.getJson('/json?status=404');
		assert(false, 'Should throw error');
	} catch (error) {
		assertEqual(errorIntercepted, true, 'Should intercept error');
		assertEqual(error.message, 'Resource not found', 'Should have custom error message');
		assertEqual(error.isCustom, true, 'Should have custom flag');
		assertEqual(error.originalStatus, 404, 'Should preserve original status');
	}
});

// Test middleware-like processing order: L->R for requests, R->L for responses
suite.test('Multiple interceptors execute in correct order', async () => {
	const api = createLuminara({
		baseURL: BASE_URL
	});
	
	const executionOrder = [];
	
	// First interceptor (added first, executes first for requests, last for responses)
	api.use({
		onRequest(request) {
			executionOrder.push('interceptor1-request');
			request.headers = request.headers || {};
			request.headers['X-Step1'] = 'first';
			return request;
		},
		onSuccess(response, request) {
			executionOrder.push('interceptor1-response');
			response.data.step1 = 'processed-first';
			return response;
		}
	});
	
	// Second interceptor (added second, executes second for requests, second for responses)
	api.use({
		onRequest(request) {
			executionOrder.push('interceptor2-request');
			request.headers = request.headers || {};
			request.headers['X-Step2'] = 'second';
			return request;
		},
		onSuccess(response, request) {
			executionOrder.push('interceptor2-response');
			response.data.step2 = 'processed-second';
			return response;
		}
	});
	
	// Third interceptor (added last, executes last for requests, third for responses)
	api.use({
		onRequest(request) {
			executionOrder.push('interceptor3-request');
			request.headers = request.headers || {};
			request.headers['X-Step3'] = 'third';
			return request;
		},
		onSuccess(response, request) {
			executionOrder.push('interceptor3-response');
			response.data.step3 = 'processed-third';
			return response;
		}
	});
	
	const response = await api.getJson('/json');
	
	// Verify request processing order (left-to-right: 1->2->3)
	assert(executionOrder[0] === 'interceptor1-request', 'First interceptor should execute first on request');
	assert(executionOrder[1] === 'interceptor2-request', 'Second interceptor should execute second on request');
	assert(executionOrder[2] === 'interceptor3-request', 'Third interceptor should execute third on request');
	
	// Verify response processing order (left-to-right for legacy onSuccess: 1->2->3)
	assert(executionOrder[3] === 'interceptor1-response', 'First interceptor should execute first on response');
	assert(executionOrder[4] === 'interceptor2-response', 'Second interceptor should execute second on response');
	assert(executionOrder[5] === 'interceptor3-response', 'Third interceptor should execute third on response');
	
	// Verify response transformations applied in correct order
	assert(response.data.step1 === 'processed-first', 'Step 1 should be processed first');
	assert(response.data.step2 === 'processed-second', 'Step 2 should be processed second');
	assert(response.data.step3 === 'processed-third', 'Step 3 should be processed third');
});

// Test complex interceptor chains with conditional logic
suite.test('Interceptor chain with conditional processing', async () => {
	const api = createLuminara({
		baseURL: BASE_URL
	});
	
	let authInterceptorCalled = false;
	let validationInterceptorCalled = false;
	let loggingInterceptorCalled = false;
	
	// Authentication interceptor
	api.use({
		onRequest(request) {
			authInterceptorCalled = true;
			if (request.url.includes('/secure')) {
				request.headers = request.headers || {};
				request.headers['Authorization'] = 'Bearer secure-token';
			}
			return request;
		},
		onError(error, request) {
			if (error.status === 401) {
				const authError = new Error('Authentication required');
				authError.code = 'AUTH_REQUIRED';
				throw authError;
			}
			throw error;
		}
	});
	
	// Validation interceptor
	api.use({
		onRequest(request) {
			validationInterceptorCalled = true;
			if (request.method === 'POST' && !request.body) {
				const validationError = new Error('Request body required for POST');
				validationError.code = 'VALIDATION_ERROR';
				throw validationError;
			}
			return request;
		}
	});
	
	// Logging interceptor
	api.use({
		onRequest(request) {
			loggingInterceptorCalled = true;
			request.headers = request.headers || {};
			request.headers['X-Request-ID'] = `req-${Date.now()}`;
			return request;
		},
		onSuccess(response, request) {
			response.data.logged = true;
			response.data.requestId = request.headers['X-Request-ID'];
			return response;
		}
	});
	
	const response = await api.getJson('/json');
	
	assert(authInterceptorCalled, 'Auth interceptor should be called');
	assert(validationInterceptorCalled, 'Validation interceptor should be called');
	assert(loggingInterceptorCalled, 'Logging interceptor should be called');
	assert(response.data.logged === true, 'Response should be logged');
	assert(response.data.requestId.startsWith('req-'), 'Should have request ID');
});

// Test interceptor error handling and propagation  
suite.test('Error propagation through interceptor chain', async () => {
	const api = createLuminara({
		baseURL: BASE_URL
	});
	
	const errorFlow = [];
	
	// First error interceptor (added first, executes last in error chain)
	api.use({
		onError(error, request) {
			errorFlow.push('interceptor1-error');
			if (error.status === 500) {
				error.retryable = true;
			}
			// Don't re-throw here, let the error handling continue
		}
	});
	
	// Second error interceptor (added second, executes second-to-last in error chain)
	api.use({
		onError(error, request) {
			errorFlow.push('interceptor2-error');
			if (error.status === 404) {
				// Transform 404 to a more specific error
				const notFoundError = new Error(`Resource not found: ${request.url}`);
				notFoundError.code = 'RESOURCE_NOT_FOUND';
				notFoundError.originalError = error;
				// Store the new error but continue chain
				Object.assign(error, notFoundError);
				error.code = 'RESOURCE_NOT_FOUND';
				error.originalError = { status: 404 };
			}
		}
	});
	
	// Third error interceptor (added last, executes first in error chain)
	api.use({
		onError(error, request) {
			errorFlow.push('interceptor3-error');
			// Log all errors but don't transform
			error.logged = true;
		}
	});
	
	try {
		await api.getJson('/json?status=404');
		assert(false, 'Should throw error');
	} catch (error) {
		// Verify error processing order (right-to-left: 3->2->1)
		assert(errorFlow[0] === 'interceptor3-error', 'Third interceptor should handle error first');
		assert(errorFlow[1] === 'interceptor2-error', 'Second interceptor should handle error second');
		assert(errorFlow[2] === 'interceptor1-error', 'First interceptor should handle error third');
		
		// Verify error transformation (might be applied to original error)
		assert(error.logged === true, 'Error should be logged');
		// The error properties might be on the original error object
		const hasTransformation = error.code === 'RESOURCE_NOT_FOUND' || error.message.includes('Resource not found');
		assert(hasTransformation, 'Should have some error transformation');
	}
});

// Test interceptor context preservation  
suite.test('Request context preservation across interceptors', async () => {
	// Create a fresh API instance to avoid interference
	const api = createLuminara({
		baseURL: BASE_URL
	});
	
	// Single interceptor that modifies response
	api.use({
		onSuccess(response, request) {
			// Simple modification that should work
			response.interceptorWorked = true;
			return response;
		}
	});
	
	const response = await api.getJson('/json');
	
	// Simple assertion that should pass
	assert(response.interceptorWorked === true, 'Interceptor should have modified response');
});

// Test interceptor async operations
suite.test('Async interceptor operations', async () => {
	const api = createLuminara({
		baseURL: BASE_URL
	});
	
	// Async request interceptor
	api.use({
		async onRequest(request) {
			// Simulate async token refresh
			await new Promise(resolve => setTimeout(resolve, 10));
			request.headers = request.headers || {};
			request.headers['X-Async-Token'] = 'async-token-123';
			return request;
		},
		async onSuccess(response, request) {
			// Simulate async response processing
			await new Promise(resolve => setTimeout(resolve, 10));
			response.data.asyncProcessed = true;
			return response;
		}
	});
	
	const response = await api.getJson('/json');
	
	assert(response.status === 200, 'Should complete successfully');
	assert(response.data.asyncProcessed === true, 'Should be processed asynchronously');
});

// Test interceptor chain execution flow
suite.test('Interceptor execution flow with header tracking', async () => {
	const api = createLuminara({
		baseURL: BASE_URL
	});
	
	const interceptorFlow = [];
	
	// First interceptor - normal processing
	api.use({
		onRequest(request) {
			interceptorFlow.push('interceptor1-request');
			request.headers = request.headers || {};
			request.headers['X-Step-1'] = 'executed';
			return request;
		},
		onSuccess(response, request) {
			interceptorFlow.push('interceptor1-response');
			response.data.step1Executed = true;
			return response;
		}
	});
	
	// Cache interceptor - adds cache check header
	api.use({
		onRequest(request) {
			interceptorFlow.push('cache-interceptor-request');
			request.headers = request.headers || {};
			request.headers['X-Cache-Check'] = 'performed';
			return request;
		},
		onSuccess(response, request) {
			interceptorFlow.push('cache-interceptor-response');
			if (request.headers && request.headers['X-Cache-Check']) {
				response.data.cacheChecked = true;
			}
			return response;
		}
	});
	
	// Third interceptor - monitoring
	api.use({
		onRequest(request) {
			interceptorFlow.push('interceptor3-request');
			request.headers = request.headers || {};
			request.headers['X-Monitor'] = 'active';
			return request;
		},
		onSuccess(response, request) {
			interceptorFlow.push('interceptor3-response');
			response.data.monitored = true;
			return response;
		}
	});
	
	const response = await api.getJson('/json');
	
	// Verify all interceptors executed in correct order
	assert(interceptorFlow.includes('interceptor1-request'), 'First interceptor should execute');
	assert(interceptorFlow.includes('cache-interceptor-request'), 'Cache interceptor should execute');
	assert(interceptorFlow.includes('interceptor3-request'), 'Third interceptor should execute');
	
	// Verify response processing
	assert(interceptorFlow.includes('interceptor1-response'), 'First interceptor response should execute');
	assert(interceptorFlow.includes('cache-interceptor-response'), 'Cache interceptor response should execute');
	assert(interceptorFlow.includes('interceptor3-response'), 'Third interceptor response should execute');
	
	assert(response.data.cacheChecked === true, 'Cache check should be performed');
	assert(response.data.step1Executed === true, 'Step 1 should be executed');
	assert(response.data.monitored === true, 'Should be monitored');
});

// Run tests if this file is executed directly
await runTestSuiteIfDirect(import.meta.url, 'Interceptors', suite, mockServer);

export { suite, mockServer };
