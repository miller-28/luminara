import { createLuminara, OfetchDriver, LuminaraClient } from '../../src/index.js';
import { TestSuite, MockServer, assert, assertEqual } from '../testUtils.js';
import { fileURLToPath } from 'url';

const suite = new TestSuite('Custom Drivers');
const mockServer = new MockServer(3006);

// Create a custom mock driver for testing
class MockDriver {
	constructor(options = {}) {
		this.options = options;
		this.requestLog = [];
	}
	
	async request(requestOptions) {
		// Log the request
		this.requestLog.push({
			method: requestOptions.method,
			url: requestOptions.url,
			headers: requestOptions.headers,
			body: requestOptions.body,
			timestamp: Date.now()
		});
		
		// Simulate different response types based on URL
		if (requestOptions.url.includes('/mock-success')) {
			return {
				status: 200,
				statusText: 'OK',
				headers: { 'content-type': 'application/json' },
				data: { message: 'Mock driver success', driver: 'custom' }
			};
		}
		
		if (requestOptions.url.includes('/mock-error')) {
			const error = new Error('Mock driver error');
			error.status = 500;
			throw error;
		}
		
		// Default response
		return {
			status: 200,
			statusText: 'OK',
			headers: { 'content-type': 'application/json' },
			data: { message: 'Mock response', url: requestOptions.url }
		};
	}
	
	getRequestLog() {
		return this.requestLog;
	}
	
	clearLog() {
		this.requestLog = [];
	}
}

// Test custom driver integration
suite.test('Custom driver integration', async () => {
	const mockDriver = new MockDriver();
	
	const api = new LuminaraClient(mockDriver);
	
	const response = await api.getJson('/mock-success');
	
	assert(response.status === 200, 'Custom driver should return 200');
	assert(response.data.driver === 'custom', 'Response should indicate custom driver');
	assert(response.data.message === 'Mock driver success', 'Should get correct mock message');
	
	const log = mockDriver.getRequestLog();
	assert(log.length === 1, 'Should log one request');
	assert(log[0].method === 'GET', 'Should log correct method');
	assert(log[0].url.includes('/mock-success'), 'Should log correct URL');
});

suite.test('Custom driver handles errors', async () => {
	const mockDriver = new MockDriver();
	
	const api = new LuminaraClient(mockDriver);
	
	try {
		await api.getJson('/mock-error');
		assert(false, 'Should throw error from custom driver');
	} catch (error) {
		assert(error.message === 'Mock driver error', 'Should get custom driver error message');
		assert(error.status === 500, 'Should preserve error status');
	}
	
	const log = mockDriver.getRequestLog();
	assert(log.length === 1, 'Should log request even when it fails');
});

suite.test('Custom driver receives all request options', async () => {
	const mockDriver = new MockDriver();
	
	const api = new LuminaraClient(mockDriver);
	
	await api.postJson('/test-endpoint', 
		{ name: 'John', age: 30 },
		{ 
			headers: { 'X-Custom': 'test-header' },
			timeout: 5000
		}
	);
	
	const log = mockDriver.getRequestLog();
	const request = log[0];
	
	assert(request.method === 'POST', 'Should receive correct method');
	assert(request.url.includes('/test-endpoint'), 'Should receive correct URL');
	assert(request.headers['X-Custom'] === 'test-header', 'Should receive custom headers');
	assert(request.body !== undefined, 'Should receive request body');
});

suite.test('Default OfetchDriver functionality', async () => {
	// Test that the default OfetchDriver works correctly
	const api = createLuminara({
		baseURL: 'http://localhost:3006'
	});
	
	const response = await api.getJson('/json');
	
	assert(response.status === 200, 'OfetchDriver should return 200');
	assert(response.data.message === 'Success', 'Should get correct response data');
});

suite.test('Driver option mapping validation', async () => {
	const mockDriver = new MockDriver();
	
	// Override request method to capture options
	let capturedOptions = null;
	const originalRequest = mockDriver.request.bind(mockDriver);
	mockDriver.request = async (options) => {
		capturedOptions = { ...options };
		return await originalRequest(options);
	};
	
	const api = new LuminaraClient(mockDriver);
	
	await api.request({
		url: '/test',
		method: 'GET',
		timeout: 3000,
		retry: 2,
		headers: { 'Authorization': 'Bearer token123' }
	});
	
	assert(capturedOptions !== null, 'Should capture request options');
	assert(capturedOptions.timeout === 3000, 'Should pass timeout to driver');
	assert(capturedOptions.retry === 2, 'Should pass retry to driver');
	assert(capturedOptions.headers.Authorization === 'Bearer token123', 'Should pass headers to driver');
});

suite.test('Plugin compatibility with custom driver', async () => {
	const mockDriver = new MockDriver();
	let pluginCalled = false;
	
	const api = new LuminaraClient(mockDriver);
	
	api.use({
		onRequest(request) {
			pluginCalled = true;
			return {
				...request,
				headers: {
					...request.headers,
					'X-Plugin-Added': 'true'
				}
			};
		}
	});
	
	await api.getJson('/test');
	
	assert(pluginCalled, 'Plugin should be called with custom driver');
	
	const log = mockDriver.getRequestLog();
	const request = log[0];
	assert(request.headers['X-Plugin-Added'] === 'true', 'Plugin should modify request for custom driver');
});

suite.test('Custom driver with backoff strategies', async () => {
	const mockDriver = new MockDriver();
	let capturedOptions = null;
	
	// Override request to capture the options passed to the driver
	const originalRequest = mockDriver.request.bind(mockDriver);
	mockDriver.request = async (options) => {
		capturedOptions = { ...options };
		return await originalRequest(options);
	};
	
	const api = new LuminaraClient(mockDriver);
	
	const response = await api.request({
		url: '/test',
		method: 'GET',
		retry: 3,
		retryDelay: 50,
		backoffType: 'linear'
	});
	
	assert(response.status === 200, 'Should get successful response');
	assert(capturedOptions !== null, 'Should capture options passed to driver');
	assert(capturedOptions.retry === 3, 'Should pass retry option to driver');
	assert(capturedOptions.retryDelay === 50, 'Should pass retryDelay option to driver');
	assert(capturedOptions.backoffType === 'linear', 'Should pass backoffType option to driver');
	
	const log = mockDriver.getRequestLog();
	assert(log.length === 1, 'Should make one request (custom driver handles retry logic itself)');
});

suite.test('Driver comparison - ofetch vs custom', async () => {
	// Test with OfetchDriver
	const ofetchApi = createLuminara({
		baseURL: 'http://localhost:3006'
	});
	
	const ofetchResponse = await ofetchApi.getJson('/json');
	
	// Test with custom driver
	const mockDriver = new MockDriver();
	const customApi = new LuminaraClient(mockDriver);
	
	const customResponse = await customApi.getJson('/mock-success');
	
	// Both should return valid responses but with different data
	assert(ofetchResponse.status === 200, 'Ofetch driver should work');
	assert(customResponse.status === 200, 'Custom driver should work');
	
	assert(ofetchResponse.data.message === 'Success', 'Ofetch should get real server response');
	assert(customResponse.data.driver === 'custom', 'Custom driver should get mock response');
});

suite.test('Driver method requirements validation', async () => {
	// Test that driver must implement request method
	class IncompleteDriver {
		// Missing request method
	}
	
	try {
		const api = new LuminaraClient(new IncompleteDriver());
		
		await api.getJson('/test');
		assert(false, 'Should fail with incomplete driver');
	} catch (error) {
		// Should fail because driver doesn't implement request method
		assert(error.message.includes('request') || 
		       error.message.includes('function') ||
		       error.message.includes('method'),
		       `Should fail due to missing request method, got: ${error.message}`);
	}
});

suite.test('Driver initialization options', async () => {
	class ConfigurableDriver {
		constructor(options = {}) {
			this.config = options;
		}
		
		async request(requestOptions) {
			return {
				status: 200,
				statusText: 'OK',
				headers: { 'content-type': 'application/json' },
				data: { 
					message: 'Configured driver',
					config: this.config 
				}
			};
		}
	}
	
	const driverConfig = { timeout: 5000, customOption: 'test-value' };
	const driver = new ConfigurableDriver(driverConfig);
	
	const api = new LuminaraClient(driver);
	
	const response = await api.getJson('/test');
	
	assert(response.data.config.timeout === 5000, 'Driver should receive configuration');
	assert(response.data.config.customOption === 'test-value', 'Driver should preserve custom config');
});

// Run tests if this file is executed directly
if (fileURLToPath(import.meta.url) === process.argv[1]) {
	console.log('🧪 Running Custom Drivers Tests...');
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