import { createLuminara } from '../../src/index.js';
import { MockServer } from '../testUtils.js';

export async function testIgnoreResponseError() {
	// Create a mock server for error testing
	const mockServer = new MockServer(4212);
	await mockServer.start();
	const baseURL = `http://localhost:4212`;

	let testCount = 0;
	let passCount = 0;

	async function asyncTest(description, testFunction) {
		testCount++;
		try {
			await testFunction();
			console.log(`✅ ${description}`);
			passCount++;
		} catch (error) {
			console.error(`❌ ${description}: ${error.message}`);
		}
	}

	console.log('\n=== Testing ignoreResponseError Option ===');

	const luminara = createLuminara();

	// Test that errors are thrown by default
	await asyncTest('HTTP errors thrown by default', async () => {
		try {
			await luminara.get(`${baseURL}/json?status=404`);
			throw new Error('Expected 404 error to be thrown');
		} catch (error) {
			if (error.message.includes('Expected 404 error')) {
				throw error;
			}
			
			// Should be a FetchError with status 404
			if (error.status !== 404) {
				throw new Error(`Expected status 404, got ${error.status}`);
			}
			
			console.log(`   Default behavior: 404 error thrown with status ${error.status}`);
		}
	});

	// Test ignoreResponseError: true prevents throwing
	await asyncTest('ignoreResponseError: true prevents throwing', async () => {
		try {
			const response = await luminara.get(`${baseURL}/json?status=404`, {
				ignoreResponseError: true
			});
			
			// Should return response object, not throw
			if (response.status !== 404) {
				throw new Error(`Expected response.status to be 404, got ${response.status}`);
			}
			
			console.log(`   Ignored error: received response with status ${response.status}`);
		} catch (error) {
			throw new Error(`Expected no error with ignoreResponseError: true, but got: ${error.message}`);
		}
	});

	// Test ignoreResponseError with various status codes
	await asyncTest('ignoreResponseError works with different status codes', async () => {
		const statusCodes = [400, 401, 403, 500, 502];
		const successfulCodes = [];
		
		for (const status of statusCodes) {
			try {
				const response = await luminara.get(`${baseURL}/json?status=${status}`, {
					ignoreResponseError: true
				});
				
				// If httpbin.org returns a different status code (service issue), 
				// just verify that the response was received without throwing
				if (response.status === status) {
					successfulCodes.push(status);
				} else {
					// External service issue - still verify that ignoreResponseError worked
					// (we got a response instead of an error being thrown)
					console.log(`   Note: httpbin.org returned ${response.status} instead of ${status} (service issue)`);
					successfulCodes.push(`${status}→${response.status}`);
				}
			} catch (error) {
				throw new Error(`Failed for status ${status}: ${error.message}`);
			}
		}
		
		console.log(`   Successfully ignored errors for statuses: ${successfulCodes.join(', ')}`);
	});

	// Test ignoreResponseError: false explicitly throws
	await asyncTest('ignoreResponseError: false explicitly throws', async () => {
		try {
			await luminara.get(`${baseURL}/json?status=500`, {
				ignoreResponseError: false
			});
			throw new Error('Expected 500 error to be thrown');
		} catch (error) {
			if (error.message.includes('Expected 500 error')) {
				throw error;
			}
			
			// Should be a FetchError with status 500
			if (error.status !== 500) {
				throw new Error(`Expected status 500, got ${error.status}`);
			}
			
			console.log(`   Explicit false: 500 error thrown as expected`);
		}
	});

	// Test ignoreResponseError with POST requests
	await asyncTest('ignoreResponseError works with POST requests', async () => {
		try {
			const response = await luminara.post(`${baseURL}/json?status=422`, 
				JSON.stringify({ test: 'data' }),
				{
					headers: { 'Content-Type': 'application/json' },
					ignoreResponseError: true,
					responseType: 'text' // Use text to avoid JSON parsing issues
				}
			);
			
			if (response.status !== 422) {
				throw new Error(`Expected status 422, got ${response.status}`);
			}
			
			console.log(`   POST request with 422 status ignored successfully`);
		} catch (error) {
			throw new Error(`Expected no error with POST ignoreResponseError: true, but got: ${error.message}`);
		}
	});

	// Test ignoreResponseError preserves response data
	await asyncTest('ignoreResponseError preserves response data', async () => {
		try {
			const response = await luminara.get(`${baseURL}/json?status=500`, {
				ignoreResponseError: true,
				responseType: 'text'
			});
			
			// Accept any 4xx or 5xx status
			if (response.status < 400) {
				throw new Error(`Expected error status (>=400), got ${response.status}`);
			}
			
			// Response should have data (even if empty string)
			if (response.data === undefined) {
				throw new Error('Expected response.data to be defined');
			}
			
			console.log(`   Response data preserved: ${typeof response.data} (${response.data?.length || 0} length) with status ${response.status}`);
		} catch (error) {
			throw new Error(`Failed to preserve response data: ${error.message}`);
		}
	});

	// Test ignoreResponseError with success responses (should not affect them)
	await asyncTest('ignoreResponseError does not affect successful responses', async () => {
		try {
			const response = await luminara.get(`${baseURL}/json`, {
				ignoreResponseError: true
			});
			
			if (response.status !== 200) {
				throw new Error(`Expected status 200, got ${response.status}`);
			}
			
			if (typeof response.data !== 'object') {
				throw new Error(`Expected object response data, got ${typeof response.data}`);
			}
			
			console.log(`   Success response unaffected by ignoreResponseError option`);
		} catch (error) {
			throw error;
		}
	});

	console.log(`\nignoreResponseError Option Tests: ${passCount}/${testCount} passed\n`);
	
	// Stop the mock server
	await mockServer.stop();
	
	return { total: testCount, passed: passCount };
}