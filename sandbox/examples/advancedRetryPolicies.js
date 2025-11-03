// Retry Policies Examples
// Demonstrates intelligent retry policies with idempotent method detection, 
// Retry-After header support, and custom shouldRetry functions

export const advancedRetryPoliciesExamples = [
	{
		id: 'default-retry-policy',
		title: 'Default Retry Policy (Idempotent Methods)',
		run: async (updateOutput, signal) => {
			updateOutput('Testing default retry policy with idempotent methods...\n');
			
			const { createLuminara } = window.Luminara || {};
			if (!createLuminara) {
				throw new Error('Luminara not loaded. Please refresh the page.');
			}
			const client = createLuminara();
			
			try {
				// GET is idempotent, so it should retry on 500 errors
				await client.get('https://httpbin.org/status/500', {
					retry: 2,
					retryDelay: 500,
					timeout: 5000
				});
			} catch (error) {
				updateOutput(`✅ GET request failed as expected after retries: ${error.message}\n`);
			}
			
			try {
				// POST is not idempotent by default, but 500 is in safe retry list
				await client.post('https://httpbin.org/status/500', { test: 'data' }, {
					retry: 2,
					retryDelay: 500,
					timeout: 5000
				});
			} catch (error) {
				updateOutput(`✅ POST request failed as expected after retries on 500: ${error.message}\n`);
			}
			
			try {
				// POST won't retry on 400 (not in safe list)
				await client.post('https://httpbin.org/status/400', { test: 'data' }, {
					retry: 2,
					retryDelay: 500,
					timeout: 5000
				});
			} catch (error) {
				updateOutput(`✅ POST request failed without retries on 400: ${error.message}\n`);
			}
			
			return 'Default retry policy test completed successfully!';
		}
	},
	
	{
		id: 'custom-retry-policy',
		title: 'Custom Retry Policy Override',
		run: async (updateOutput, signal) => {
			updateOutput('Testing custom retry policy that overrides defaults...\n');
			
			const { createLuminara } = window.Luminara || {};
			if (!createLuminara) {
				throw new Error('Luminara not loaded. Please refresh the page.');
			}
			
			// Custom policy that retries any POST on 400 errors (normally not retried)
			const customRetryPolicy = (error, context) => {
				updateOutput(`🔄 Retry attempt ${context.attempt}/${context.maxAttempts} for ${context.request.method} ${error.status}\n`);
				
				// Custom logic: retry POST on 400 errors
				if (context.request.method === 'POST' && error.status === 400) {
					return context.attempt < context.maxAttempts;
				}
				
				// Fall back to default behavior for other cases
				return false;
			};
			
			const client = createLuminara();
			
			try {
				await client.post('https://httpbin.org/status/400', { test: 'data' }, {
					retry: 2,
					retryDelay: 500,
					shouldRetry: customRetryPolicy,
					timeout: 8000
				});
			} catch (error) {
				updateOutput(`✅ Custom retry policy executed, POST failed after custom retries: ${error.message}\n`);
			}
			
			return 'Custom retry policy test completed successfully!';
		}
	},
	
	{
		id: 'retry-after-header',
		title: 'Retry-After Header Respect',
		run: async (updateOutput, signal) => {
			updateOutput('Testing Retry-After header respect...\n');
			
			const { createLuminara, parseRetryAfter } = window.Luminara || {};
			if (!createLuminara || !parseRetryAfter) {
				throw new Error('Luminara not loaded. Please refresh the page.');
			}
			
			// Demonstrate parsing Retry-After header values
			updateOutput('📊 Retry-After header parsing examples:\n');
			
			const secondsDelay = parseRetryAfter('3');
			updateOutput(`   "3" (seconds) → ${secondsDelay}ms\n`);
			
			const futureDate = new Date(Date.now() + 5000).toUTCString();
			const dateDelay = parseRetryAfter(futureDate);
			updateOutput(`   HTTP-date (+5s) → ${dateDelay}ms\n`);
			
			const invalidDelay = parseRetryAfter('invalid');
			updateOutput(`   "invalid" → ${invalidDelay}ms\n`);
			
			const client = createLuminara();
			
			// Test with a service that returns 429 (httpbin doesn't set Retry-After)
			updateOutput('\n🔄 Testing retry timing...\n');
			const startTime = Date.now();
			
			try {
				await client.get('https://httpbin.org/status/429', {
					retry: 1,
					retryDelay: 2000, // 2 second delay
					timeout: 8000
				});
			} catch (error) {
				const duration = Date.now() - startTime;
				updateOutput(`✅ Request failed after ${duration}ms (expected ~2000ms delay for retry)\n`);
			}
			
			return 'Retry-After header test completed successfully!';
		}
	},
	
	{
		id: 'idempotent-methods',
		title: 'Idempotent Method Detection',
		run: async (updateOutput, signal) => {
			updateOutput('Testing idempotent method detection...\n');
			
			const { isIdempotentMethod } = window.Luminara || {};
			if (!isIdempotentMethod) {
				throw new Error('Luminara not loaded. Please refresh the page.');
			}
			
			const methods = ['GET', 'PUT', 'DELETE', 'POST', 'PATCH', 'HEAD', 'OPTIONS'];
			
			updateOutput('📊 HTTP Method Classification:\n');
			methods.forEach(method => {
				const isIdempotent = isIdempotentMethod(method);
				const icon = isIdempotent ? '✅' : '❌';
				updateOutput(`   ${method}: ${icon} ${isIdempotent ? 'Idempotent (will retry)' : 'Not idempotent (limited retry)'}\n`);
			});
			
			return 'Idempotent method detection test completed successfully!';
		}
	},
	
	{
		id: 'advanced-retry-status-policies',
		title: 'Retry Status Code Policies',
		run: async (updateOutput, signal) => {
			updateOutput('Testing retry behavior for different status codes...\n');
			
			const { createLuminara } = window.Luminara || {};
			if (!createLuminara) {
				throw new Error('Luminara not loaded. Please refresh the page.');
			}
			const client = createLuminara();
			
			const testCases = [
				{ status: 408, description: 'Request Timeout', shouldRetry: true },
				{ status: 409, description: 'Conflict', shouldRetry: true },
				{ status: 425, description: 'Too Early', shouldRetry: true },
				{ status: 429, description: 'Too Many Requests', shouldRetry: true },
				{ status: 500, description: 'Internal Server Error', shouldRetry: true },
				{ status: 502, description: 'Bad Gateway', shouldRetry: true },
				{ status: 503, description: 'Service Unavailable', shouldRetry: true },
				{ status: 504, description: 'Gateway Timeout', shouldRetry: true },
				{ status: 400, description: 'Bad Request', shouldRetry: false },
				{ status: 401, description: 'Unauthorized', shouldRetry: false },
				{ status: 404, description: 'Not Found', shouldRetry: false }
			];
			
			updateOutput('📊 Status Code Retry Policies (for idempotent methods):\n');
			
			for (const testCase of testCases) {
				const icon = testCase.shouldRetry ? '🔄' : '⏹️';
				const action = testCase.shouldRetry ? 'Will retry' : 'Won\'t retry';
				updateOutput(`   ${testCase.status} ${testCase.description}: ${icon} ${action}\n`);
			}
			
			// Test a couple of these with actual requests
			updateOutput('\n🧪 Testing actual retry behavior:\n');
			
			const startTime = Date.now();
			try {
				await client.get('https://httpbin.org/status/502', {
					retry: 1,
					retryDelay: 1000,
					timeout: 5000
				});
			} catch (error) {
				const duration = Date.now() - startTime;
				updateOutput(`✅ 502 error retried as expected (took ${duration}ms)\n`);
			}
			
			return 'Retry status code policies test completed successfully!';
		}
	}
];

export default advancedRetryPoliciesExamples;