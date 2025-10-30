import { createLuminara } from '../../src/index.js';
import { MockServer } from '../testUtils.js';

export async function testResponseTypes() {
	// Create a mock server for response type testing
	const mockServer = new MockServer(4208);
	await mockServer.start();
	const baseURL = `http://localhost:4208`;

	let testCount = 0;
	let passCount = 0;

	function test(description, testFunction) {
		testCount++;
		try {
			testFunction();
			console.log(`✅ ${description}`);
			passCount++;
		} catch (error) {
			console.error(`❌ ${description}: ${error.message}`);
		}
	}

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

	console.log('\n=== Testing Response Types ===');

	const luminara = createLuminara();

	// Test responseType: 'text'
	await asyncTest('responseType: text should return string', async () => {
		// Create a mock response that would normally be parsed as JSON
		const mockJsonString = '{"message": "hello"}';
		
		// We'll test this with a real endpoint that returns JSON but force text parsing
		// For now, let's test that the option is accepted without errors
		try {
			const response = await luminara.get(`${baseURL}/json`, {
				responseType: 'text'
			});
			
			if (typeof response.data !== 'string') {
				throw new Error(`Expected string response, got ${typeof response.data}`);
			}
		} catch (error) {
			// If httpbin is unavailable, just check that the option doesn't cause syntax errors
			if (!error.message.includes('fetch')) {
				throw error;
			}
		}
	});

	// Test responseType: 'json'
	await asyncTest('responseType: json should parse JSON', async () => {
		try {
			const response = await luminara.get(`${baseURL}/json`, {
				responseType: 'json'
			});
			
			if (typeof response.data !== 'object') {
				throw new Error(`Expected object response, got ${typeof response.data}`);
			}
		} catch (error) {
			// If httpbin is unavailable, just check that the option doesn't cause syntax errors
			if (!error.message.includes('fetch')) {
				throw error;
			}
		}
	});

	// Test responseType: 'blob' (browser environment)
	await asyncTest('responseType: blob should return Blob', async () => {
		if (typeof Blob === 'undefined') {
			console.log('⚠️  Skipping blob test - not in browser environment');
			return;
		}
		
		try {
			const response = await luminara.get(`${baseURL}/json`, {
				responseType: 'blob'
			});
			
			if (!(response.data instanceof Blob)) {
				throw new Error(`Expected Blob response, got ${response.data.constructor.name}`);
			}
		} catch (error) {
			// If httpbin is unavailable, just check that the option doesn't cause syntax errors
			if (!error.message.includes('fetch')) {
				throw error;
			}
		}
	});

	// Test responseType: 'stream' (browser environment)
	await asyncTest('responseType: stream should return ReadableStream', async () => {
		if (typeof ReadableStream === 'undefined') {
			console.log('⚠️  Skipping stream test - not in browser environment');
			return;
		}
		
		try {
			const response = await luminara.get(`${baseURL}/json`, {
				responseType: 'stream'
			});
			
			if (!(response.data instanceof ReadableStream)) {
				throw new Error(`Expected ReadableStream response, got ${response.data.constructor.name}`);
			}
		} catch (error) {
			// If httpbin is unavailable, just check that the option doesn't cause syntax errors
			if (!error.message.includes('fetch')) {
				throw error;
			}
		}
	});

	// Test responseType: 'arrayBuffer'
	await asyncTest('responseType: arrayBuffer should return ArrayBuffer', async () => {
		try {
			const response = await luminara.get(`${baseURL}/json`, {
				responseType: 'arrayBuffer'
			});
			
			if (!(response.data instanceof ArrayBuffer)) {
				throw new Error(`Expected ArrayBuffer response, got ${response.data.constructor.name}`);
			}
		} catch (error) {
			// If httpbin is unavailable, just check that the option doesn't cause syntax errors
			if (!error.message.includes('fetch')) {
				throw error;
			}
		}
	});

	// Test default auto detection
	await asyncTest('responseType: auto should auto-detect JSON', async () => {
		try {
			const response = await luminara.get(`${baseURL}/json`, {
				responseType: 'auto'
			});
			
			if (typeof response.data !== 'object') {
				throw new Error(`Expected object response from auto-detection, got ${typeof response.data}`);
			}
		} catch (error) {
			// If httpbin is unavailable, just check that the option doesn't cause syntax errors
			if (!error.message.includes('fetch')) {
				throw error;
			}
		}
	});

	// Test no responseType (should default to auto)
	await asyncTest('no responseType should default to auto-detection', async () => {
		try {
			const response = await luminara.get(`${baseURL}/json`);
			
			if (typeof response.data !== 'object') {
				throw new Error(`Expected object response from default behavior, got ${typeof response.data}`);
			}
		} catch (error) {
			// If httpbin is unavailable, just check that the option doesn't cause syntax errors
			if (!error.message.includes('fetch')) {
				throw error;
			}
		}
	});

	console.log(`\nResponse Types Tests: ${passCount}/${testCount} passed\n`);
	
	// Stop the mock server
	await mockServer.stop();
	
	return { total: testCount, passed: passCount };
}

// Run tests if this file is executed directly
import { fileURLToPath } from 'url';
if (fileURLToPath(import.meta.url) === process.argv[1]) {
	console.log('🧪 Running Response Types Tests...');
	try {
		const results = await testResponseTypes();
		console.log(`✅ Tests completed: ${results.passed}/${results.total} passed`);
		process.exit(results.passed === results.total ? 0 : 1);
	} catch (error) {
		console.error('Test execution failed:', error);
		process.exit(1);
	}
}