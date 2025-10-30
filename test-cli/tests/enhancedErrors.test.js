import { createLuminara } from '../../src/index.js';

export async function testEnhancedErrors() {
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

	console.log('\n=== Testing Enhanced Error Properties ===');

	const luminara = createLuminara();

	// Test HTTP error with enhanced properties
	await asyncTest('HTTP error includes status, statusText, data, and options', async () => {
		try {
			await luminara.get('https://httpbin.org/status/404');
			throw new Error('Expected request to fail with 404');
		} catch (error) {
			// Verify error has enhanced properties
			if (typeof error.status !== 'number') {
				throw new Error(`Expected error.status to be number, got ${typeof error.status}`);
			}
			
			if (typeof error.statusText !== 'string') {
				throw new Error(`Expected error.statusText to be string, got ${typeof error.statusText}`);
			}
			
			if (!error.options || typeof error.options !== 'object') {
				throw new Error(`Expected error.options to be object, got ${typeof error.options}`);
			}
			
			if (!error.options.url || !error.options.method) {
				throw new Error(`Expected error.options to include url and method`);
			}
			
			// Verify error name is set
			if (error.name !== 'FetchError') {
				throw new Error(`Expected error.name to be 'FetchError', got '${error.name}'`);
			}
			
			console.log(`   Status: ${error.status} ${error.statusText}`);
			console.log(`   URL: ${error.options.url}`);
			console.log(`   Method: ${error.options.method}`);
		}
	});

	// Test timeout error with enhanced properties
	await asyncTest('Timeout error includes options and proper structure', async () => {
		try {
			await luminara.get('https://httpbin.org/delay/5', {
				timeout: 100 // Very short timeout
			});
			throw new Error('Expected request to timeout');
		} catch (error) {
			// Verify timeout error structure
			if (error.name !== 'TimeoutError') {
				throw new Error(`Expected error.name to be 'TimeoutError', got '${error.name}'`);
			}
			
			if (!error.options || typeof error.options !== 'object') {
				throw new Error(`Expected error.options to be object, got ${typeof error.options}`);
			}
			
			if (error.options.timeout !== 100) {
				throw new Error(`Expected error.options.timeout to be 100, got ${error.options.timeout}`);
			}
			
			// Timeout errors should have null status properties
			if (error.status !== null) {
				throw new Error(`Expected error.status to be null for timeout, got ${error.status}`);
			}
			
			if (error.statusText !== null) {
				throw new Error(`Expected error.statusText to be null for timeout, got ${error.statusText}`);
			}
			
			console.log(`   Timeout: ${error.options.timeout}ms`);
			console.log(`   URL: ${error.options.url}`);
		}
	});

	// Test abort error with enhanced properties
	await asyncTest('Abort error includes options and proper structure', async () => {
		const controller = new AbortController();
		
		// Abort after a short delay
		setTimeout(() => controller.abort('Request cancelled by user'), 50);
		
		try {
			await luminara.get('https://httpbin.org/delay/2', {
				signal: controller.signal
			});
			throw new Error('Expected request to be aborted');
		} catch (error) {
			// Verify abort error structure  
			if (error.name !== 'AbortError') {
				throw new Error(`Expected error.name to be 'AbortError', got '${error.name}'`);
			}
			
			if (!error.options || typeof error.options !== 'object') {
				throw new Error(`Expected error.options to be object, got ${typeof error.options}`);
			}
			
			// Abort errors should have null status properties
			if (error.status !== null) {
				throw new Error(`Expected error.status to be null for abort, got ${error.status}`);
			}
			
			console.log(`   Reason: ${error.message}`);
			console.log(`   URL: ${error.options.url}`);
		}
	});

	// Test error options include request configuration
	await asyncTest('Error options include all relevant request configuration', async () => {
		try {
			// Use a simpler error case that doesn't cause JSON parsing issues
			await luminara.get('https://httpbin.org/status/500', 
				{
					headers: { 'X-Custom': 'test' },
					timeout: 5000,
					retry: 2,
					retryDelay: 1000,
					responseType: 'json'
				}
			);
			throw new Error('Expected request to fail with 500');
		} catch (error) {
			console.log('   Error object:', {
				name: error.name,
				status: error.status,
				statusText: error.statusText,
				hasOptions: !!error.options
			});
			
			const options = error.options;
			
			if (!options) {
				throw new Error('Expected error.options to exist');
			}
			
			// Check all expected properties
			const expectedProps = ['url', 'method', 'headers', 'timeout', 'retry', 'retryDelay', 'responseType'];
			for (const prop of expectedProps) {
				if (!(prop in options)) {
					throw new Error(`Expected error.options.${prop} to exist`);
				}
			}
			
			if (options.method !== 'GET') {
				throw new Error(`Expected method to be GET, got ${options.method}`);
			}
			
			if (options.timeout !== 5000) {
				throw new Error(`Expected timeout to be 5000, got ${options.timeout}`);
			}
			
			if (options.retry !== 2) {
				throw new Error(`Expected retry to be 2, got ${options.retry}`);
			}
			
			console.log(`   All configuration preserved in error options`);
		}
	});

	console.log(`\nEnhanced Error Properties Tests: ${passCount}/${testCount} passed\n`);
	return { total: testCount, passed: passCount };
}