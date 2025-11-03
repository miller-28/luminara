import { createLuminara } from '../../src/index.js';
import { TestSuite, MockServer, assert, assertEqual } from '../testUtils.js';
import { runTestSuiteIfDirect } from '../runTestSuite.js';

const suite = new TestSuite('Interceptors');
const mockServer = new MockServer(4221);
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

// Run tests if this file is executed directly
await runTestSuiteIfDirect(import.meta.url, 'Interceptors', suite, mockServer);

export { suite, mockServer };
