import { createLuminara } from "../../dist/index.mjs";

export const verboseLogging = {
	title: "🔍 Verbose Logging",
	examples: [
		{
			id: "verbose-comprehensive",
			title: "Comprehensive Verbose Logging",
			run: async (updateOutput, signal, options = {}) => {
				const client = createLuminara({
					baseURL: 'https://httpbingo.org',
					verbose: options.verbose || false, // Use passed verbose option or default to false
					timeout: 5000,
					retry: 3,
					retryDelay: 500,
					backoffType: 'exponential'
				});

				try {
					updateOutput("🔍 Testing comprehensive verbose logging...\n\n");
					updateOutput("👁️ Check the browser console for detailed verbose logs!\n\n");
					updateOutput("🚀 Starting requests with different scenarios:\n\n");

					// Test 1: Successful request with verbose logging
					updateOutput("📡 Test 1: Successful request\n");
					const successResponse = await client.get('/json', {
						query: { test: 'verbose', scenario: 'success' },
						responseType: 'json',
						signal
					});
					updateOutput(`✅ Success: ${successResponse.status}\n\n`);

					// Test 2: Request with timeout (should show timeout verbose logs)
					updateOutput("⏰ Test 2: Timeout scenario\n");
					try {
						await client.get('/delay/10', {
							timeout: 1000, // 1 second timeout for 10 second delay
							signal
						});
					} catch (timeoutError) {
						updateOutput(`⏰ Timeout caught: ${timeoutError.message}\n\n`);
					}

					// Test 3: Request with retry and backoff (should show retry verbose logs)
					updateOutput("🔄 Test 3: Retry with exponential backoff\n");
					try {
						await client.get('/status/503', {
							retry: 2,
							retryDelay: 300,
							backoffType: 'exponential',
							signal
						});
					} catch (retryError) {
						updateOutput(`🔄 Retry exhausted: ${retryError.message}\n\n`);
					}

					// Test 4: Request with custom headers and body (should show request verbose logs)
					updateOutput("📋 Test 4: POST request with headers and body\n");
					const postResponse = await client.post('/post', {
						title: 'Verbose Test',
						description: 'Testing comprehensive verbose logging'
					}, {
						headers: {
							'X-Test-Header': 'verbose-logging',
							'X-Custom-Value': 'luminara'
						},
						signal
					});
					updateOutput(`📋 POST Success: ${postResponse.status}\n\n`);

					return `🔍 Comprehensive verbose logging test completed!\n\n` +
						   `✅ All verbose logging features demonstrated:\n` +
						   `  • Core client configuration and plugin system\n` +
						   `  • Driver selection and feature detection\n` +
						   `  • URL building and query parameters\n` +
						   `  • Timeout setup and signal handling\n` +
						   `  • Request execution and response parsing\n` +
						   `  • Error handling and classification\n` +
						   `  • Retry policies and backoff strategies\n` +
						   `  • HTTP status handling and transformations\n\n` +
						   `🎯 Check browser console for detailed logs with timing, strategy info, and decision explanations!`;

				} catch (error) {
					return `❌ Verbose logging test failed: ${error.message}\n\n` +
						   `🔍 Check browser console for detailed error logs and troubleshooting information.`;
				}
			}
		},
		{
			id: "verbose-error-handling",
			title: "Verbose Error Handling & Classification",
			run: async (updateOutput, signal, options = {}) => {
				const client = createLuminara({
					verbose: options.verbose || false, // Use passed verbose option or default to false
					retry: 2,
					retryDelay: 200
				});

				try {
					updateOutput("🔍 Testing verbose error handling and classification...\n\n");
					updateOutput("👁️ Watch console for detailed error analysis!\n\n");

					// Test different error types with verbose logging
					const errorTests = [
						{ status: 404, name: "Not Found (4xx)" },
						{ status: 500, name: "Server Error (5xx)" },
						{ status: 429, name: "Rate Limit (retryable)" },
						{ delay: 15, timeout: 1000, name: "Timeout Error" }
					];

					for (const test of errorTests) {
						updateOutput(`🧪 Testing: ${test.name}\n`);
						
						try {
							if (test.delay) {
								await client.get(`https://httpbingo.org/delay/${test.delay}`, {
									timeout: test.timeout,
									signal
								});
							} else {
								await client.get(`https://httpbingo.org/status/${test.status}`, {
									signal
								});
							}
						} catch (error) {
							updateOutput(`  ❌ ${error.name}: ${error.message}\n`);
						}
						
						updateOutput(`  📊 Check console for error classification details\n\n`);
					}

					return `🔍 Error handling verbose logging test completed!\n\n` +
						   `📊 Demonstrated verbose logging for:\n` +
						   `  • Error detection and classification\n` +
						   `  • HTTP status code analysis\n` +
						   `  • Retry decision making\n` +
						   `  • Timeout error transformation\n` +
						   `  • Network error handling\n` +
						   `  • Error enrichment with context\n\n` +
						   `🎯 All errors were logged with detailed reasoning and context!`;

				} catch (error) {
					return `❌ Error handling test failed: ${error.message}`;
				}
			}
		},
		{
			id: "verbose-feature-showcase",
			title: "Feature-by-Feature Verbose Showcase",
			run: async (updateOutput, signal, options = {}) => {
				updateOutput("🔍 Testing feature-specific verbose logging...\n\n");
				updateOutput("👁️ Each feature demonstrates its own verbose logger!\n\n");

				// Test URL building verbose logging
				updateOutput("🔗 URL Building & Query Processing:\n");
				const client1 = createLuminara({
					baseURL: 'https://httpbingo.org',
					verbose: options.verbose || false // Use passed verbose option or default to false
				});
				
				await client1.get('/get', {
					query: { 
						feature: 'url-building',
						test: 'verbose',
						param1: 'value1',
						param2: 'value2' 
					},
					signal
				});
				updateOutput("  ✅ URL verbose logging demonstrated\n\n");

				// Test response parsing verbose logging
				updateOutput("📥 Response Parsing & Type Detection:\n");
				const client2 = createLuminara({ verbose: options.verbose || false }); // Use passed verbose option or default to false
				
				await client2.get('https://httpbingo.org/json', {
					responseType: 'json',
					signal
				});
				updateOutput("  ✅ Response parsing verbose logging demonstrated\n\n");

				// Test timeout verbose logging
				updateOutput("⏰ Timeout Configuration & Handling:\n");
				const client3 = createLuminara({ verbose: options.verbose || false }); // Use passed verbose option or default to false
				
				try {
					await client3.get('https://httpbingo.org/delay/3', {
						timeout: 1000,
						signal
					});
				} catch (timeoutError) {
					updateOutput("  ✅ Timeout verbose logging demonstrated\n\n");
				}

				// Test plugin verbose logging
				updateOutput("🔌 Plugin System & Lifecycle:\n");
				const client4 = createLuminara({ verbose: options.verbose || false }); // Use passed verbose option or default to false
				
				client4.use({
					name: 'test-plugin',
					onRequest: (context) => {
						context.req.headers = { 
							...context.req.headers, 
							'X-Plugin-Test': 'verbose-logging' 
						};
						return context.req;
					},
					onResponse: (context) => {
						// Plugin executed
					}
				});

				await client4.get('https://httpbingo.org/headers', { signal });
				updateOutput("  ✅ Plugin verbose logging demonstrated\n\n");

				return `🔍 Feature showcase completed!\n\n` +
					   `🎯 Each Luminara feature now has dedicated verbose logging:\n` +
					   `  • URL: Building, validation, query processing\n` +
					   `  • Timeout: Setup, signals, detection\n` +
					   `  • Response: Parsing, type detection, transformation\n` +
					   `  • Error: Classification, transformation, recovery\n` +
					   `  • Retry: Policies, backoff calculations, exhaustion\n` +
					   `  • Core: Configuration, plugins, request lifecycle\n\n` +
					   `📊 All logs include context, timing, and decision reasoning!`;
			}
		}
	]
};