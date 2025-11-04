import { createLuminara } from "../../dist/index.mjs";

export const errorHandling = {
	title: "🛠️ Error Handling",
	examples: [
		{
			id: "http-error-json",
			title: "HTTP Error with JSON Data",
			run: async (updateOutput, signal, options = {}) => {
				updateOutput("Testing HTTP error with JSON response...");
				
				const client = createLuminara({ verbose: options.verbose || false });
				
				try {
					// This should return a 400 error with JSON data
					await client.post('https://httpbingo.org/status/400', {
						message: "Invalid request data"
					}, { signal });
					updateOutput("❌ Expected error but request succeeded");
				} catch (error) {
					if (error.name === 'AbortError') throw error;
					
					return `✅ Caught LuminaraError:
  Name: ${error.name}
  Message: ${error.message}
  Status: ${error.status}
  Code: ${error.code || 'undefined'}
  Data: ${error.data ? JSON.stringify(error.data, null, 2) : 'undefined'}
  Request URL: ${error.request?.url}
  Request Method: ${error.request?.method}
  Response Status: ${error.response?.status}
  Attempt: ${error.attempt}`;
				}
			}
		},
		{
			id: "network-error",
			title: "Network Error",
			run: async (updateOutput, signal, options = {}) => {
				updateOutput("Testing network error...");
				
				const client = createLuminara({ verbose: options.verbose || false });
				
				try {
					// Use a non-existent domain to trigger network error
					await client.get('https://this-domain-does-not-exist-12345.com/api/test', { signal });
					updateOutput("❌ Expected error but request succeeded");
				} catch (error) {
					if (error.name === 'AbortError') throw error;
					
					return `✅ Caught LuminaraError:
  Name: ${error.name}
  Message: ${error.message}
  Status: ${error.status || 'undefined'}
  Code: ${error.code || 'undefined'}
  Data: ${error.data ? JSON.stringify(error.data, null, 2) : 'undefined'}
  Request URL: ${error.request?.url}
  Request Method: ${error.request?.method}
  Type: Network Error (no response object)
  Attempt: ${error.attempt}`;
				}
			}
		},
		{
			id: "timeout-error",
			title: "Timeout Error",
			run: async (updateOutput, signal, options = {}) => {
				updateOutput("Testing timeout error...");
				
				const client = createLuminara({ verbose: options.verbose || false });
				
				try {
					// This should timeout after 100ms
					await client.get('https://httpbingo.org/delay/2', { 
						timeout: 100,
						signal 
					});
					updateOutput("❌ Expected timeout but request succeeded");
				} catch (error) {
					if (error.name === 'AbortError') throw error;
					
					return `✅ Caught LuminaraError:
  Name: ${error.name}
  Message: ${error.message}
  Status: ${error.status || 'undefined'}
  Code: ${error.code || 'undefined'}
  Type: ${error.name}
  Request URL: ${error.request?.url}
  Request Method: ${error.request?.method}
  Timeout: 100ms
  Attempt: ${error.attempt}`;
				}
			}
		},
		{
			id: "abort-error",
			title: "Abort Error",
			run: async (updateOutput, signal, options = {}) => {
				updateOutput("Testing abort error...");
				
				const client = createLuminara({ verbose: options.verbose || false });
				const controller = new AbortController();
				
				// Abort the request after 100ms
				setTimeout(() => controller.abort(), 100);
				
				try {
					await client.get('https://httpbingo.org/delay/2', { 
						signal: controller.signal
					});
					updateOutput("❌ Expected abort but request succeeded");
				} catch (error) {
					if (signal.aborted) throw error; // Re-throw if our main signal was aborted
					
					return `✅ Caught LuminaraError:
  Name: ${error.name}
  Message: ${error.message}
  Status: ${error.status || 'undefined'}
  Code: ${error.code || 'undefined'}
  Type: ${error.name}
  Request URL: ${error.request?.url}
  Request Method: ${error.request?.method}
  Aborted: ${error.name === 'AbortError'}
  Attempt: ${error.attempt}`;
				}
			}
		},
		{
			id: "retry-error-tracking",
			title: "Error Tracking Across Retries",
			run: async (updateOutput, signal, options = {}) => {
				updateOutput("Testing error tracking across retries...");
				
				const client = createLuminara({ verbose: options.verbose || false });
				let attemptCount = 0;
				
				// Add interceptor to track attempts
				client.use({
					onRequest(context) {
						attemptCount++;
						updateOutput(`Attempt ${attemptCount}: Making request...`);
					},
					onResponseError(context) {
						updateOutput(`Attempt ${attemptCount}: Error occurred, status ${context.error?.status}`);
					}
				});
				
				try {
					// This will retry 2 times on 500 errors
					await client.get('https://httpbingo.org/status/500', { 
						retry: 2,
						retryDelay: 300,
						signal 
					});
					updateOutput("❌ Expected error but request succeeded");
				} catch (error) {
					if (error.name === 'AbortError') throw error;
					
					return `✅ Final Error After ${attemptCount} Attempts:
  Name: ${error.name}
  Message: ${error.message}
  Status: ${error.status}
  Code: ${error.code || 'undefined'}
  Total Attempts: ${attemptCount}
  Final Attempt: ${error.attempt}
  Request URL: ${error.request?.url}
  Request Method: ${error.request?.method}
  
🎯 Notice how the error contains the final attempt number!`;
				}
			}
		},
		{
			id: "ignore-response-error",
			title: "Ignore Response Errors",
			run: async (updateOutput, signal, options = {}) => {
				updateOutput("Testing ignoreResponseError option...");
				
				const client = createLuminara({ verbose: options.verbose || false });
				
				try {
					// This should return the error response without throwing
					const errorResponse = await client.get('https://httpbingo.org/status/404', { 
						ignoreResponseError: true,
						signal 
					});
					
					return `✅ Received error response without throwing:
  Status: ${errorResponse.status}
  Status Text: ${errorResponse.statusText || 'undefined'}
  Headers: ${JSON.stringify(errorResponse.headers, null, 2)}
  Data: ${errorResponse.data ? JSON.stringify(errorResponse.data, null, 2) : 'undefined'}
  
🎯 With ignoreResponseError: true, 4xx/5xx responses don't throw errors!`;
				} catch (error) {
					if (error.name === 'AbortError') throw error;
					
					return `❌ Unexpected error: ${error.message}`;
				}
			}
		}
	]
};