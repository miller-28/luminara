/**
 * Error Handling Examples
 * Demonstrates LuminaraError normalization and consistent error structure
 */

export const errorHandlingExamples = [
	{
		name: "HTTP Error with JSON Data",
		description: "Server returns JSON error data that gets parsed into error.data",
		category: "Error Handling",
		async execute(client, updateOutput) {
			updateOutput("Testing HTTP error with JSON response...");
			
			try {
				// This should return a 400 error with JSON data
				await client.post('https://httpbingo.org/status/400', {
					message: "Invalid request data"
				});
				updateOutput("❌ Expected error but request succeeded");
			} catch (error) {
				updateOutput(`✅ Caught LuminaraError:`);
				updateOutput(`  Name: ${error.name}`);
				updateOutput(`  Message: ${error.message}`);
				updateOutput(`  Status: ${error.status}`);
				updateOutput(`  Code: ${error.code}`);
				updateOutput(`  Data: ${error.data ? JSON.stringify(error.data, null, 2) : 'undefined'}`);
				updateOutput(`  Request URL: ${error.request?.url}`);
				updateOutput(`  Request Method: ${error.request?.method}`);
				updateOutput(`  Response Status: ${error.response?.status}`);
				updateOutput(`  Attempt: ${error.attempt}`);
			}
		}
	},
	
	{
		name: "Network Error",
		description: "Network failure that creates a network error",
		category: "Error Handling", 
		async execute(client, updateOutput) {
			updateOutput("Testing network error...");
			
			try {
				// Use a non-existent domain to trigger network error
				await client.get('https://this-domain-does-not-exist-12345.com/api/test');
				updateOutput("❌ Expected error but request succeeded");
			} catch (error) {
				updateOutput(`✅ Caught LuminaraError:`);
				updateOutput(`  Name: ${error.name}`);
				updateOutput(`  Message: ${error.message}`);
				updateOutput(`  Status: ${error.status || 'undefined'}`);
				updateOutput(`  Code: ${error.code}`);
				updateOutput(`  Data: ${error.data || 'undefined'}`);
				updateOutput(`  Request URL: ${error.request?.url}`);
				updateOutput(`  Request Method: ${error.request?.method}`);
				updateOutput(`  Attempt: ${error.attempt}`);
				updateOutput(`  Original Error: ${error.cause?.name || 'undefined'}`);
			}
		}
	},
	
	{
		name: "Timeout Error",
		description: "Request timeout that creates a timeout error",
		category: "Error Handling",
		async execute(client, updateOutput) {
			updateOutput("Testing timeout error (timeout: 100ms)...");
			
			try {
				// Use a delay endpoint with short timeout
				await client.get('https://httpbingo.org/delay/2', {
					timeout: 100
				});
				updateOutput("❌ Expected timeout error but request succeeded");
			} catch (error) {
				updateOutput(`✅ Caught LuminaraError:`);
				updateOutput(`  Name: ${error.name}`);
				updateOutput(`  Message: ${error.message}`);
				updateOutput(`  Status: ${error.status || 'undefined'}`);
				updateOutput(`  Code: ${error.code}`);
				updateOutput(`  Data: ${error.data || 'undefined'}`);
				updateOutput(`  Request URL: ${error.request?.url}`);
				updateOutput(`  Request Method: ${error.request?.method}`);
				updateOutput(`  Request Timeout: ${error.request?.timeout}ms`);
				updateOutput(`  Attempt: ${error.attempt}`);
			}
		}
	},
	
	{
		name: "Parse Error",
		description: "Invalid response that causes a parse error",
		category: "Error Handling",
		async execute(client, updateOutput) {
			updateOutput("Testing parse error with invalid JSON...");
			
			try {
				// Try to parse HTML as JSON (this should fail)
				await client.get('https://httpbingo.org/html', {
					responseType: 'json'
				});
				updateOutput("❌ Expected parse error but request succeeded");
			} catch (error) {
				updateOutput(`✅ Caught LuminaraError:`);
				updateOutput(`  Name: ${error.name}`);
				updateOutput(`  Message: ${error.message}`);
				updateOutput(`  Status: ${error.status}`);
				updateOutput(`  Code: ${error.code}`);
				updateOutput(`  Data: ${error.data || 'undefined'}`);
				updateOutput(`  Request URL: ${error.request?.url}`);
				updateOutput(`  Request Method: ${error.request?.method}`);
				updateOutput(`  Response Status: ${error.response?.status}`);
				updateOutput(`  Response Content-Type: ${error.response?.headers?.['content-type']}`);
				updateOutput(`  Attempt: ${error.attempt}`);
				updateOutput(`  Original Error: ${error.cause?.name || 'undefined'}`);
			}
		}
	},
	
	{
		name: "Error with Retry Attempts", 
		description: "Error handling across multiple retry attempts",
		category: "Error Handling",
		async execute(client, updateOutput) {
			updateOutput("Testing error with retry attempts...");
			let attemptCount = 0;
			
			try {
				await client.get('https://httpbingo.org/status/500', {
					retry: 2,
					retryDelay: 500,
					onRetry: (error, attempt) => {
						attemptCount = attempt;
						updateOutput(`  Retry attempt ${attempt}: ${error.message}`);
					}
				});
				updateOutput("❌ Expected error but request succeeded");
			} catch (error) {
				updateOutput(`✅ Final LuminaraError after ${attemptCount} retries:`);
				updateOutput(`  Name: ${error.name}`);
				updateOutput(`  Message: ${error.message}`);
				updateOutput(`  Status: ${error.status}`);
				updateOutput(`  Code: ${error.code}`);
				updateOutput(`  Data: ${error.data ? JSON.stringify(error.data, null, 2) : 'undefined'}`);
				updateOutput(`  Request URL: ${error.request?.url}`);
				updateOutput(`  Request Method: ${error.request?.method}`);
				updateOutput(`  Response Status: ${error.response?.status}`);
				updateOutput(`  Final Attempt: ${error.attempt}`);
			}
		}
	},
	
	{
		name: "Custom Error Data Parsing",
		description: "Server error with custom JSON error structure",
		category: "Error Handling",
		async execute(client, updateOutput) {
			updateOutput("Testing custom error data parsing...");
			
			try {
				// Simulate a server error with custom error structure
				await client.post('https://httpbingo.org/status/422', {
					field: "email",
					value: "invalid-email"
				}, {
					headers: {
						'Content-Type': 'application/json'
					}
				});
				updateOutput("❌ Expected error but request succeeded");
			} catch (error) {
				updateOutput(`✅ Caught LuminaraError with server data:`);
				updateOutput(`  Name: ${error.name}`);
				updateOutput(`  Message: ${error.message}`);
				updateOutput(`  Status: ${error.status}`);
				updateOutput(`  Code: ${error.code}`);
				
				// Show detailed error data structure
				if (error.data) {
					updateOutput(`  Error Data:`);
					updateOutput(`    ${JSON.stringify(error.data, null, 4)}`);
				} else {
					updateOutput(`  Error Data: undefined`);
				}
				
				updateOutput(`  Request Details:`);
				updateOutput(`    URL: ${error.request?.url}`);
				updateOutput(`    Method: ${error.request?.method}`);
				updateOutput(`    Headers: ${JSON.stringify(error.request?.headers, null, 4)}`);
				
				updateOutput(`  Response Details:`);
				updateOutput(`    Status: ${error.response?.status}`);
				updateOutput(`    Status Text: ${error.response?.statusText}`);
				updateOutput(`    Headers: ${JSON.stringify(error.response?.headers, null, 4)}`);
				
				updateOutput(`  Debugging Info:`);
				updateOutput(`    Attempt: ${error.attempt}`);
				updateOutput(`    Error Type: ${typeof error}`);
				updateOutput(`    Error Constructor: ${error.constructor.name}`);
			}
		}
	}
];