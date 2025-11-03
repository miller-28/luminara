// errorHandlingTests.js - Comprehensive Error Handling and Retry Tests
// Consolidated error handling tests covering normalization, retries, and various error scenarios

import { createLuminara } from '../../services/luminaraService'

// Comprehensive Error Handling Tests (merged errorHandlingTests + retryErrorTests)
export const errorHandlingTests = [
	// Error Structure and Normalization Tests
	{
		name: 'Basic Error Normalization',
		call: async (abortSignal, api) => {
			const options = abortSignal ? { signal: abortSignal } : {}
			try {
				await api.get('https://httpbingo.org/status/404', options);
				throw new Error('Expected 404 error but request succeeded');
			} catch (error) {
				console.log(`404 error: ${error.name}`);
				console.log(`Error message: ${error.message}`);
				console.log(`Error code: ${error.code}`);
				console.log(`Response status: ${error.response?.status}`);
				console.log(`Attempt: ${error.attempt}`);
				console.log(`Has original error: ${error.cause ? 'Yes' : 'No'}`);
				
				// Validate basic error structure
				if (error.name !== 'LuminaraError') {
					throw new Error(`Expected LuminaraError, got ${error.name}`);
				}
				
				if (error.code !== 'HTTP_ERROR') {
					throw new Error(`Expected HTTP_ERROR code, got ${error.code}`);
				}
				
				if (!error.response || error.response.status !== 404) {
					throw new Error('404 error should have response with status 404');
				}
				
				return { message: "✅ 404 error properly normalized" };
			}
		},
		expected: 'Should normalize HTTP errors with proper LuminaraError structure'
	},

	{
		name: 'JSON Error Data Parsing',
		call: async (abortSignal, api) => {
			const options = abortSignal ? { signal: abortSignal } : {}
			try {
				await api.get('https://httpbingo.org/status/422', options);
				throw new Error('Expected 422 error but request succeeded');
			} catch (error) {
				console.log(`422 error: ${error.name}`);
				console.log(`Error message: ${error.message}`);
				console.log(`Error code: ${error.code}`);
				console.log(`Response status: ${error.response?.status}`);
				console.log(`Response data:`, error.response?.data);
				console.log(`Attempt: ${error.attempt}`);
				
				// Validate JSON error parsing
				if (error.name !== 'LuminaraError') {
					throw new Error(`Expected LuminaraError, got ${error.name}`);
				}
				
				if (error.code !== 'HTTP_ERROR') {
					throw new Error(`Expected HTTP_ERROR code, got ${error.code}`);
				}
				
				if (!error.response || error.response.status !== 422) {
					throw new Error('422 error should have response with status 422');
				}
				
				return { message: "✅ 422 error with JSON data properly parsed" };
			}
		},
		expected: 'Should parse JSON error response data when available'
	},

	{
		name: 'Error Handling with Retries',
		call: async (abortSignal, api) => {
			const options = abortSignal ? { signal: abortSignal } : {}
			try {
				await api.get('https://httpbingo.org/status/503', options);
				throw new Error('Expected 503 error but request succeeded');
			} catch (error) {
				console.log(`503 error after retries: ${error.name}`);
				console.log(`Error message: ${error.message}`);
				console.log(`Error code: ${error.code}`);
				console.log(`Response status: ${error.response?.status}`);
				console.log(`Final attempt: ${error.attempt}`);
				console.log(`Max attempts reached: ${error.attempt >= 3 ? 'Yes' : 'No'}`);
				
				// Validate retried error
				if (error.name !== 'LuminaraError') {
					throw new Error(`Expected LuminaraError, got ${error.name}`);
				}
				
				if (error.code !== 'HTTP_ERROR') {
					throw new Error(`Expected HTTP_ERROR code, got ${error.code}`);
				}
				
				if (error.attempt < 3) {
					throw new Error(`Expected at least 3 attempts, got ${error.attempt}`);
				}
				
				return { message: `✅ 503 error retried ${error.attempt} times before failing` };
			}
		},
		expected: 'Should retry failed requests and track attempt count in final error'
	},

	{
		name: 'Timeout Error Structure',
		call: async (abortSignal, api) => {
			const timeoutApi = createLuminara({ timeout: 100 }); // Very short timeout
			const options = abortSignal ? { signal: abortSignal } : {}
			try {
				await timeoutApi.get('https://httpbingo.org/delay/2', options); // 2 second delay
				throw new Error('Expected timeout error but request succeeded');
			} catch (error) {
				console.log(`Timeout error: ${error.name}`);
				console.log(`Error message: ${error.message}`);
				console.log(`Error code: ${error.code}`);
				console.log(`Has timeout info: ${error.message.includes('timeout') ? 'Yes' : 'No'}`);
				console.log(`Attempt: ${error.attempt}`);
				
				// Validate timeout error structure
				if (error.name !== 'LuminaraError') {
					throw new Error(`Expected LuminaraError, got ${error.name}`);
				}
				
				if (!['TIMEOUT', 'NETWORK_ERROR'].includes(error.code)) {
					throw new Error(`Expected TIMEOUT or NETWORK_ERROR code, got ${error.code}`);
				}
				
				if (!error.message.toLowerCase().includes('timeout')) {
					throw new Error(`Expected 'timeout' in message, got: ${error.message}`);
				}
				
				return { message: "✅ Timeout error properly normalized" };
			}
		},
		expected: 'Should normalize timeout errors with proper TIMEOUT code and structure'
	},

	{
		name: 'Network Error Structure',
		call: async (abortSignal, api) => {
			const options = abortSignal ? { signal: abortSignal } : {}
			try {
				// Use invalid domain to trigger network error
				await api.get('https://invalid-domain-that-does-not-exist-12345.com', options);
				throw new Error('Expected network error but request succeeded');
			} catch (error) {
				console.log(`Network error: ${error.name}`);
				console.log(`Error message: ${error.message}`);
				console.log(`Error code: ${error.code}`);
				console.log(`Has network info: ${error.message.includes('network') || error.message.includes('DNS') || error.message.includes('ENOTFOUND') ? 'Yes' : 'No'}`);
				console.log(`Attempt: ${error.attempt}`);
				console.log(`Has original error: ${error.cause ? 'Yes' : 'No'}`);
				
				// Validate network error structure
				if (error.name !== 'LuminaraError') {
					throw new Error(`Expected LuminaraError, got ${error.name}`);
				}
				
				if (error.code !== 'NETWORK_ERROR') {
					throw new Error(`Expected NETWORK_ERROR code, got ${error.code}`);
				}
				
				// Network errors should have descriptive messages
				const hasNetworkKeyword = error.message.toLowerCase().includes('network') || 
										  error.message.includes('DNS') || 
										  error.message.includes('ENOTFOUND') ||
										  error.message.includes('getaddrinfo');
				
				if (!hasNetworkKeyword) {
					throw new Error(`Expected network-related keywords in message, got: ${error.message}`);
				}
				
				return { message: "✅ Network error properly normalized" };
			}
		},
		expected: 'Should normalize network errors with proper NETWORK_ERROR code and structure'
	},

	{
		name: 'Abort Error Structure',
		call: async (abortSignal, api) => {
			try {
				const controller = new AbortController();
				const options = { signal: controller.signal };
				
				// Start request and abort it quickly
				const requestPromise = api.get('https://httpbingo.org/delay/3', options);
				setTimeout(() => controller.abort(), 10);
				
				await requestPromise;
				throw new Error('Expected abort error but request succeeded');
			} catch (error) {
				console.log(`Abort error: ${error.name}`);
				console.log(`Error message: ${error.message}`);
				console.log(`Error code: ${error.code}`);
				console.log(`Has abort info: ${error.message.includes('abort') ? 'Yes' : 'No'}`);
				console.log(`Attempt: ${error.attempt}`);
				console.log(`Has original error: ${error.cause ? 'Yes' : 'No'}`);
				
				// Validate abort error structure
				if (error.name !== 'LuminaraError') {
					throw new Error(`Expected LuminaraError, got ${error.name}`);
				}
				
				if (error.code !== 'ABORT') {
					throw new Error(`Expected ABORT code, got ${error.code}`);
				}
				
				if (!error.message.includes('abort')) {
					throw new Error(`Expected 'abort' in message, got: ${error.message}`);
				}
				
				return { message: "✅ Abort error properly normalized" };
			}
		},
		expected: 'Should normalize aborted requests with proper ABORT code and structure'
	},
	
	{
		name: 'Parse Error Structure',
		call: async (abortSignal, api) => {
			const options = abortSignal ? { signal: abortSignal, responseType: 'json' } : { responseType: 'json' }
			try {
				// Try to parse HTML as JSON (should fail)
				await api.get('https://httpbingo.org/html', options);
				throw new Error('Expected parse error but request succeeded');
			} catch (error) {
				console.log(`Parse error: ${error.name}`);
				console.log(`Error message: ${error.message}`);
				console.log(`Error code: ${error.code}`);
				console.log(`Response status: ${error.response?.status}`);
				console.log(`Response content-type: ${error.response?.headers?.['content-type']}`);
				console.log(`Attempt: ${error.attempt}`);
				console.log(`Has original error: ${error.cause ? 'Yes' : 'No'}`);
				
				// Validate parse error structure
				if (error.name !== 'LuminaraError') {
					throw new Error(`Expected LuminaraError, got ${error.name}`);
				}
				
				if (error.code !== 'PARSE_ERROR') {
					throw new Error(`Expected PARSE_ERROR code, got ${error.code}`);
				}
				
				if (!error.response || !error.response.status) {
					throw new Error('Parse error should have response snapshot');
				}
				
				return { message: "✅ Parse error properly normalized" };
			}
		},
		expected: 'Should normalize JSON parse errors with proper PARSE_ERROR code and structure'
	},

	// Retry-Specific Error Tests (from retryErrorTests.js)
	{
		name: '503 Status with Retry',
		call: (abortSignal, api) => {
			const options = abortSignal ? { signal: abortSignal } : {}
			return api.getJson('https://httpbingo.org/status/503', options)
		},
		expected: 'Should retry 3 times with 1.5s delays - Test PASSES if retries happen'
	},
	{
		name: '500 Status with Retry',
		call: (abortSignal, api) => {
			const options = abortSignal ? { signal: abortSignal } : {}
			return api.getJson('https://httpbingo.org/status/500', options)
		},
		expected: 'Should retry 3 times with 1.5s delays - Test PASSES if retries happen'
	},
	{
		name: '429 Too Many Requests',
		call: (abortSignal, api) => {
			const retryApi = createLuminara({
				retry: 3,
				retryDelay: 1500,
				backoffType: 'linear',
				retryStatusCodes: [408, 429, 500, 502, 503, 504] // Ensure 429 is included
			})
			const options = abortSignal ? { signal: abortSignal } : {}
			return retryApi.getJson('https://httpbingo.org/status/429', options)
		},
		expected: 'Should retry for rate limit status - Test PASSES if retries happen'
	}
]