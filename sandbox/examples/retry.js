import { createLuminara } from "../../dist/index.mjs";

export const retry = {
	title: "🔄 Retry",
    examples: [
		{
			id: "retry-basic",
			title: "Basic Retry (3 attempts)",
			run: async (updateOutput, signal) => {
				const client = createLuminara();
				const retryLog = [];
				let requestCount = 0;
				
				// Add plugin to track retry attempts
				client.use({
					onRequest: (context) => {
						requestCount++;
						const attempt = context.attempt || requestCount;
						const status = attempt === 1 ? 'Initial attempt' : `Retry attempt ${attempt - 1}`;
						retryLog.push(`[${new Date().toLocaleTimeString()}] ${status} - GET /status/503`);
						
						if (updateOutput) {
							updateOutput(`Retry Count: 3\nDelay: 500ms\nEndpoint: /status/503\n\n📊 Retry Log:\n${retryLog.join('\n')}\n\n⏳ In progress...`);
						}
						
						return context;
					},
					onResponseError: (context) => {
						const status = context.error?.status || 'unknown';
						retryLog.push(`[${new Date().toLocaleTimeString()}] Response: ${status} - Will retry: ${context.attempt < 4 ? 'Yes' : 'No'}`);
						
						if (updateOutput) {
							updateOutput(`Retry Count: 3\nDelay: 500ms\nEndpoint: /status/503\n\n📊 Retry Log:\n${retryLog.join('\n')}\n\n⏳ ${context.attempt < 4 ? 'Retrying...' : 'Completing...'}`);
						}
						
						return context;
					}
				});

				try {
					await client.get('https://httpbingo.org/status/503', {
						retry: 3,
						retryDelay: 500,
						signal
					});
				} catch (error) {
					if (error.name === 'AbortError') throw error;
					retryLog.push(`[${new Date().toLocaleTimeString()}] Final result: Failed after all retries (expected)`);
					return `Retry Count: 3\nDelay: 500ms\nEndpoint: /status/503\n\n📊 Retry Log:\n${retryLog.join('\n')}\n\n⚠️ Failed after all retries as expected`;
				}
			}
		},
		{
			id: "retry-status-codes",
			title: "Retry with Status Codes",
			run: async (updateOutput, signal) => {
				updateOutput(`🔄 STARTING: Retry with Status Codes test...\n\n📋 Configuration:\n- Retry Count: 2\n- Retry on: [408, 429, 500, 502, 503]\n- Endpoint: httpbingo.org/status/429\n- Delay: 300ms between retries\n\n⏳ Creating client and making request...`);
				
				const client = createLuminara();
				const startTime = Date.now();
				
				try {
					updateOutput(`🔄 STARTING: Retry with Status Codes test...\n\n📋 Configuration:\n- Retry Count: 2\n- Retry on: [408, 429, 500, 502, 503]\n- Endpoint: httpbingo.org/status/429\n- Delay: 300ms between retries\n\n🌐 Making initial request to httpbingo.org/status/429...\n💡 Watch the Console tab → you should see multiple requests`);

					await client.get('https://httpbingo.org/status/429', {
						retry: 2,
						retryDelay: 300,
						retryStatusCodes: [408, 429, 500, 502, 503],
						signal
					});
					
					// This shouldn't happen
					const duration = Date.now() - startTime;
					return `❌ UNEXPECTED: Request succeeded in ${duration}ms (should have failed with 429)`;
					
				} catch (error) {
					if (error.name === 'AbortError') throw error;
					
					const duration = Date.now() - startTime;
					
					return `✅ COMPLETED: Retry with Status Codes Test\n\n📋 Configuration:\n- Retry Count: 2\n- Retry on: [408, 429, 500, 502, 503]\n- Endpoint: httpbingo.org/status/429\n- Delay: 300ms between retries\n\n📊 Results:\n✅ Total duration: ${duration}ms\n✅ Error type: ${error.name}\n✅ Status code: ${error.status || 'unknown'}\n✅ Retries executed: ${duration > 600 ? 'Yes (duration shows delays)' : 'Possibly'}\n\n🎯 Expected Behavior:\n- Should see 3 total requests in Console (1 initial + 2 retries)\n- Duration should be ~600ms+ (due to 2 × 300ms delays)\n- Final 429 error is correct behavior\n\n💡 Check Browser Console (F12) to see all the network requests!\n\n⚠️ This is working as expected - 429 triggers retries!`;
				}
			}
		},
		{
			id: "default-retry-policy",
			title: "Default Retry Policy (Idempotent Methods)",
			run: async (updateOutput, signal) => {
				updateOutput('Testing default retry policy with idempotent methods...\n');
				
				const client = createLuminara();
				
				try {
					// GET is idempotent, so it should retry on 500 errors
					await client.get('https://httpbingo.org/status/500', {
						retry: 2,
						retryDelay: 500,
						timeout: 5000,
						signal
					});
				} catch (error) {
					if (error.name === 'AbortError') throw error;
					updateOutput(`✅ GET request failed as expected after retries: ${error.message}\n`);
				}
				
				try {
					// POST is not idempotent by default, but 500 is in safe retry list
					await client.post('https://httpbingo.org/status/500', { test: 'data' }, {
						retry: 2,
						retryDelay: 500,
						timeout: 5000,
						signal
					});
				} catch (error) {
					if (error.name === 'AbortError') throw error;
					updateOutput(`✅ POST request failed as expected after retries on 500: ${error.message}\n`);
				}
				
				try {
					// POST won't retry on 400 (not in safe list)
					await client.post('https://httpbingo.org/status/400', { test: 'data' }, {
						retry: 2,
						retryDelay: 500,
						timeout: 5000,
						signal
					});
				} catch (error) {
					if (error.name === 'AbortError') throw error;
					updateOutput(`✅ POST request failed without retries on 400: ${error.message}\n`);
				}
				
				return 'Default retry policy test completed successfully!';
			}
		},
		{
			id: "custom-retry-policy",
			title: "Custom Retry Policy Override",
			run: async (updateOutput, signal) => {
				updateOutput('Testing custom retry policy that overrides defaults...\n');
				
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
					await client.post('https://httpbingo.org/status/400', { test: 'data' }, {
						retry: 2,
						retryDelay: 500,
						shouldRetry: customRetryPolicy,
						timeout: 8000,
						signal
					});
				} catch (error) {
					if (error.name === 'AbortError') throw error;
					updateOutput(`✅ Custom retry policy executed, POST failed after custom retries: ${error.message}\n`);
				}
				
				return 'Custom retry policy test completed successfully!';
			}
		}
    ]
};
