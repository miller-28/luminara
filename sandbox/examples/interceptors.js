import { createLuminara } from "../../dist/index.mjs";

export const interceptors = {
	title: "🔌 Interceptors",
    examples: [
		{
			id: "interceptor-request",
			title: "Request Interceptor",
			run: async (updateOutput, signal) => {
				const client = createLuminara();
				let interceptorLog = [];
				
				client.use({
					onRequest(request) {
						interceptorLog.push(`🔵 Intercepted: ${request.method} ${request.url}`);
						request.headers = { ...(request.headers || {}), 'X-Custom-Header': 'Luminara' };
						return request;
					}
				});

				const response = await client.get('https://httpbingo.org/get', { signal });
				return `${interceptorLog.join('\n')}\n\n✅ Custom header added\nStatus: ${response.status}`;
			}
		},
		{
			id: "interceptor-response",
			title: "Response Interceptor",
			run: async (updateOutput, signal) => {
				const client = createLuminara();
				let transformLog = [];

				client.use({
					onSuccess(response) {
						transformLog.push('🟢 Response received, transforming...');
						response.data.transformed = true;
						response.data.timestamp = new Date().toISOString();
						return response;
					}
				});

				const response = await client.getJson('https://jsonplaceholder.typicode.com/todos/1', { signal });
				return `${transformLog.join('\n')}\n\nOriginal todo ID: ${response.data.id}\nTransformed: ${response.data.transformed}\nTimestamp: ${response.data.timestamp}`;
			}
		},
		{
			id: "interceptor-error",
			title: "Error Interceptor",
			run: async (updateOutput, signal) => {
				const client = createLuminara();
				let errorLog = [];

				client.use({
					onError(error, request) {
						errorLog.push(`🔴 Error caught in interceptor`);
						errorLog.push(`Request: ${request.method} ${request.url}`);
						errorLog.push(`Error: ${error.message}`);
					}
				});

				try {
					await client.get('https://httpbingo.org/status/500', { signal });
				} catch (error) {
					return errorLog.join('\n') + '\n\n⚠️ Error logged by interceptor';
				}
			}
		},
		{
			id: "interceptor-execution-order",
			title: "Deterministic Execution Order",
			run: async (updateOutput, signal) => {
				const api = createLuminara({
					baseURL: 'https://httpbingo.org',
					retry: 2,
					retryDelay: 500,
					retryStatusCodes: [500, 502, 503]
				});

				let output = 'Demonstrating deterministic interceptor execution order:\n\n';

				// Interceptor 1: Authentication (First registered)
				api.use({
					onRequest(context) {
						const msg = `1️⃣ [Auth] onRequest - Adding auth (attempt ${context.attempt})`;
						output += msg + '\n';
						updateOutput(output);
						
						context.req.headers = {
							...(context.req.headers || {}),
							'X-Auth-Token': `token-attempt-${context.attempt}`,
							'X-Request-ID': Math.random().toString(36).substr(2, 9)
						};
						context.meta.authAdded = true;
					},
					onResponse(context) {
						const msg = `1️⃣ [Auth] onResponse - Validating auth (LAST in chain)`;
						output += msg + '\n';
						updateOutput(output);
					},
					onResponseError(context) {
						const msg = `1️⃣ [Auth] onResponseError - Auth error handling (LAST in chain)`;
						output += msg + '\n';
						updateOutput(output);
					}
				});

				// Interceptor 2: Logging (Second registered)
				api.use({
					onRequest(context) {
						const msg = `2️⃣ [Log] onRequest - Starting timer`;
						output += msg + '\n';
						updateOutput(output);
						
						context.meta.startTime = performance.now();
					},
					onResponse(context) {
						const duration = performance.now() - context.meta.startTime;
						const msg = `2️⃣ [Log] onResponse - Request completed in ${duration.toFixed(2)}ms (MIDDLE in chain)`;
						output += msg + '\n';
						updateOutput(output);
					},
					onResponseError(context) {
						const duration = performance.now() - context.meta.startTime;
						const msg = `2️⃣ [Log] onResponseError - Request failed after ${duration.toFixed(2)}ms (MIDDLE in chain)`;
						output += msg + '\n';
						updateOutput(output);
					}
				});

				// Interceptor 3: Analytics (Third registered)
				api.use({
					onRequest(context) {
						const msg = `3️⃣ [Analytics] onRequest - Tracking request (LAST in chain)`;
						output += msg + '\n';
						updateOutput(output);
						
						context.meta.tracked = true;
					},
					onResponse(context) {
						const msg = `3️⃣ [Analytics] onResponse - Tracking success (FIRST in chain)`;
						output += msg + '\n';
						updateOutput(output);
					},
					onResponseError(context) {
						const msg = `3️⃣ [Analytics] onResponseError - Tracking error (FIRST in chain)`;
						output += msg + '\n';
						updateOutput(output);
					}
				});

				output += '\n📡 Making request to /get...\n\n';
				updateOutput(output);

				try {
					const response = await api.getJson('/get');
					
					output += '\n✅ Success! Final response received.\n';
					output += `Response keys: ${Object.keys(response.data).join(', ')}\n`;
					
					updateOutput(output);
					return output;
				} catch (error) {
					if (error.name === 'AbortError') throw error;
					
					output += `\n❌ Error occurred: ${error.message}\n`;
					updateOutput(output);
					return output;
				}
			}
		},
		{
			id: "shared-context-metadata",
			title: "Shared Context Between Interceptors",
			run: async (updateOutput, signal) => {
				const api = createLuminara({
					baseURL: 'https://httpbingo.org'
				});

				let output = 'Demonstrating shared context between interceptors:\n\n';

				// Interceptor 1: Initialize metadata
				api.use({
					onRequest(context) {
						// Initialize shared metadata
						context.meta.correlationId = 'correlation-' + Math.random().toString(36).substr(2, 9);
						context.meta.userAgent = 'Luminara-Demo/1.0';
						context.meta.tags = ['demo', 'context-sharing'];
						
						const msg = `🏗️ [Init] Created shared metadata: correlationId=${context.meta.correlationId}`;
						output += msg + '\n';
						updateOutput(output);
					},
					onResponse(context) {
						// Enrich response with metadata
						context.res.data._luminara = {
							correlationId: context.meta.correlationId,
							tags: context.meta.tags,
							timestamp: new Date().toISOString()
						};
						
						const msg = `🏗️ [Init] Added metadata to response`;
						output += msg + '\n';
						updateOutput(output);
					}
				});

				// Interceptor 2: Use shared metadata for security
				api.use({
					onRequest(context) {
						// Use metadata from first interceptor
						context.req.headers = {
							...(context.req.headers || {}),
							'X-Correlation-ID': context.meta.correlationId,
							'X-User-Agent': context.meta.userAgent
						};
						
						const msg = `🔐 [Security] Added headers using shared metadata`;
						output += msg + '\n';
						updateOutput(output);
					}
				});

				// Interceptor 3: Analytics tracking
				api.use({
					onRequest(context) {
						context.meta.tags.push('analytics-tracked');
						
						const msg = `📊 [Analytics] Modified shared tags: [${context.meta.tags.join(', ')}]`;
						output += msg + '\n';
						updateOutput(output);
					},
					onResponse(context) {
						const msg = `📊 [Analytics] Response enhanced with: ${JSON.stringify(context.res.data._luminara, null, 2)}`;
						output += msg + '\n';
						updateOutput(output);
					}
				});

				output += '\n📡 Making request...\n\n';
				updateOutput(output);

				try {
					const response = await api.getJson('/get');
					
					output += '\n✅ Success! Context was shared between all interceptors.\n';
					output += `Final response includes _luminara metadata: ${JSON.stringify(response.data._luminara, null, 2)}\n`;
					
					updateOutput(output);
					return output;
				} catch (error) {
					if (error.name === 'AbortError') throw error;
					output += `\n❌ Error: ${error.message}\n`;
					updateOutput(output);
					return output;
				}
			}
		},
		{
			id: "retry-aware-auth",
			title: "Retry-Aware Authentication",
			run: async (updateOutput, signal) => {
				const api = createLuminara({
					baseURL: 'https://httpbingo.org',
					retry: 2,
					retryDelay: 1000
				});

				let output = 'Demonstrating retry-aware authentication:\n\n';
				let authAttempts = 0;

				// Auth interceptor that refreshes tokens on retry
				api.use({
					onRequest(context) {
						authAttempts++;
						
						// Simulate token refresh on retry
						const token = context.attempt === 1 ? 'initial-token' : `refreshed-token-${context.attempt}`;
						
						context.req.headers = {
							...(context.req.headers || {}),
							'Authorization': `Bearer ${token}`,
							'X-Attempt': context.attempt.toString()
						};
						
						const msg = `🔑 [Auth] Attempt ${context.attempt}: Using ${token}`;
						output += msg + '\n';
						updateOutput(output);
						
						context.meta.authToken = token;
					},
					onResponseError(context) {
						if (context.error.status === 401) {
							const msg = `🔑 [Auth] 401 detected on attempt ${context.attempt}, will refresh token for retry`;
							output += msg + '\n';
							updateOutput(output);
						}
					}
				});

				// Logging interceptor
				api.use({
					onRequest(context) {
						const msg = `📝 [Log] Request ${context.attempt} with auth: ${context.meta.authToken}`;
						output += msg + '\n';
						updateOutput(output);
					}
				});

				output += '\n📡 Making request to /status/401 (will trigger retries)...\n\n';
				updateOutput(output);

				try {
					await api.get('/status/401', { signal });
				} catch (error) {
					if (error.name === 'AbortError') throw error;
					
					output += `\n⚠️ Final error after ${authAttempts} auth attempts: ${error.message}\n`;
					output += `✅ Auth interceptor ran ${authAttempts} times, refreshing tokens for retries\n`;
					
					updateOutput(output);
					return output;
				}
			}
		},
		{
			id: "conditional-interceptor-processing",
			title: "Conditional Interceptor Processing",
			run: async (updateOutput, signal) => {
				const api = createLuminara({
					baseURL: 'https://httpbingo.org'
				});

				let output = 'Demonstrating conditional interceptor processing:\n\n';

				// Conditional auth interceptor
				api.use({
					onRequest(context) {
						// Only add auth for specific endpoints
						if (context.req.url.includes('/bearer')) {
							context.req.headers = {
								...(context.req.headers || {}),
								'Authorization': 'Bearer demo-token'
							};
							
							const msg = `🔐 [ConditionalAuth] Added auth for protected endpoint`;
							output += msg + '\n';
							updateOutput(output);
						} else {
							const msg = `🔐 [ConditionalAuth] Skipped auth for public endpoint`;
							output += msg + '\n';
							updateOutput(output);
						}
					}
				});

				// Conditional logging interceptor
				api.use({
					onRequest(context) {
						// Only log requests with auth
						if (context.req.headers?.Authorization) {
							context.meta.shouldLog = true;
							const msg = `📝 [ConditionalLog] Will log authenticated request`;
							output += msg + '\n';
							updateOutput(output);
						}
					},
					onResponse(context) {
						if (context.meta.shouldLog) {
							const msg = `📝 [ConditionalLog] Authenticated request completed successfully`;
							output += msg + '\n';
							updateOutput(output);
						}
					}
				});

				// Test with public endpoint first
				output += '\n📡 Testing public endpoint /get...\n\n';
				updateOutput(output);

				try {
					await api.getJson('/get');
					
					output += '\n✅ Public endpoint completed\n\n';
					output += '📡 Testing protected endpoint /bearer...\n\n';
					updateOutput(output);
					
					// Test with protected endpoint
					await api.getJson('/bearer');
					
					output += '\n✅ Protected endpoint completed\n';
					output += '🎯 Notice how interceptors behaved differently based on the endpoint!\n';
					
					updateOutput(output);
					return output;
				} catch (error) {
					if (error.name === 'AbortError') throw error;
					
					output += `\n❌ Error: ${error.message}\n`;
					updateOutput(output);
					return output;
				}
			}
		}
    ]
};
