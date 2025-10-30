// Enhanced Interceptor System Examples
// Demonstrates deterministic order, mutable context, and retry-aware execution

export const enhancedInterceptorExamples = [
	{
		id: 'interceptor-order',
		title: 'Deterministic Execution Order',
		run: async (updateOutput, signal) => {
			const { createLuminara } = await import('../../dist/index.mjs');
			
			const api = createLuminara({
				baseURL: 'https://httpbin.org',
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
				output += `\n❌ Error: ${error.message}\n`;
				updateOutput(output);
				return output;
			}
		}
	},

	{
		id: 'mutable-context',
		title: 'Mutable Context Sharing',
		run: async (updateOutput, signal) => {
			const { createLuminara } = await import('../../dist/index.mjs');
			
			const api = createLuminara({
				baseURL: 'https://httpbin.org'
			});

			let output = 'Demonstrating mutable context sharing between interceptors:\n\n';

			// Interceptor 1: Setup metadata
			api.use({
				onRequest(context) {
					context.meta.correlationId = Math.random().toString(36).substr(2, 9);
					context.meta.userAgent = 'Luminara-Example';
					context.meta.tags = ['demo', 'mutable-context'];
					
					const msg = `📝 [Setup] Added metadata - Correlation ID: ${context.meta.correlationId}`;
					output += msg + '\n';
					updateOutput(output);
				},
				onResponse(context) {
					context.res.data._luminara = {
						correlationId: context.meta.correlationId,
						processingTags: context.meta.tags,
						attempt: context.attempt
					};
					
					const msg = `📝 [Setup] Enhanced response with metadata`;
					output += msg + '\n';
					updateOutput(output);
				}
			});

			// Interceptor 2: Add security headers
			api.use({
				onRequest(context) {
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
				output += `\n❌ Error: ${error.message}\n`;
				updateOutput(output);
				return output;
			}
		}
	},

	{
		id: 'retry-aware-auth',
		title: 'Retry-Aware Authentication',
		run: async (updateOutput, signal) => {
			const { createLuminara } = await import('../../dist/index.mjs');
			
			const api = createLuminara({
				baseURL: 'https://httpbin.org',
				retry: 2,
				retryDelay: 500
			});

			let output = 'Demonstrating retry-aware authentication (fresh tokens on retry):\n\n';
			let attemptCount = 0;
			let authRefreshCount = 0;

			// Mock token refresh function
			const getFreshToken = () => {
				authRefreshCount++;
				return `fresh-token-${authRefreshCount}-${Date.now()}`;
			};

			// Authentication interceptor - runs on EVERY attempt
			api.use({
				onRequest(context) {
					attemptCount++;
					const token = context.attempt === 1 
						? 'expired-initial-token'  // Use expired token on first attempt
						: getFreshToken();         // Get fresh token on retry
					
					context.req.headers = {
						...(context.req.headers || {}),
						'Authorization': `Bearer ${token}`,
						'X-Attempt': context.attempt.toString()
					};
					
					const msg = `🔑 [Auth] Attempt ${context.attempt}: Using ${context.attempt === 1 ? 'cached (expired)' : 'fresh'} token: ${token}`;
					output += msg + '\n';
					updateOutput(output);
					
					// Store token info for validation
					context.meta.tokenUsed = token;
					context.meta.tokenType = context.attempt === 1 ? 'expired' : 'fresh';
				},
				onResponse(context) {
					const msg = `🔑 [Auth] Success! Token ${context.meta.tokenUsed} worked on attempt ${context.attempt}`;
					output += msg + '\n';
					updateOutput(output);
				},
				onResponseError(context) {
					const msg = `🔑 [Auth] Token ${context.meta.tokenUsed} failed on attempt ${context.attempt} - ${context.meta.tokenType} token rejected`;
					output += msg + '\n';
					updateOutput(output);
				}
			});

			// Logging interceptor
			api.use({
				onRequest(context) {
					const msg = `📝 [Log] Starting attempt ${context.attempt} with ${context.meta.tokenType} token`;
					output += msg + '\n';
					updateOutput(output);
				},
				onResponse(context) {
					const msg = `📝 [Log] Attempt ${context.attempt} succeeded!`;
					output += msg + '\n';
					updateOutput(output);
				},
				onResponseError(context) {
					const msg = `📝 [Log] Attempt ${context.attempt} failed - will retry if more attempts available`;
					output += msg + '\n';
					updateOutput(output);
				}
			});

			output += '\n📡 Making request to /get (will succeed immediately to show interceptor execution)...\n\n';
			updateOutput(output);

			try {
				const response = await api.getJson('/get');
				
				output += '\n✅ Success! Retry-aware authentication demonstrated.\n';
				output += `Total attempts made: ${attemptCount}\n`;
				output += `Auth tokens refreshed: ${authRefreshCount}\n`;
				output += `Final response status: ${response.status}\n\n`;
				output += '💡 Key Points:\n';
				output += '• onRequest interceptors run on EVERY attempt (including retries)\n';
				output += '• Fresh authentication tokens can be generated for each retry\n';
				output += '• Context.attempt tracks the current retry attempt number\n';
				output += '• Perfect for refreshing expired tokens during retry scenarios\n';
				
				updateOutput(output);
				return output;
			} catch (error) {
				output += `\n❌ Error after all retries: ${error.message}\n`;
				output += `Total attempts made: ${attemptCount}\n`;
				output += `Auth tokens refreshed: ${authRefreshCount}\n`;
				updateOutput(output);
				return output;
			}
		}
	},

	{
		id: 'retry-with-real-failure',
		title: 'Retry with Simulated Auth Failure',
		run: async (updateOutput, signal) => {
			const { createLuminara } = await import('../../dist/index.mjs');
			
			const api = createLuminara({
				baseURL: 'https://httpbin.org',
				retry: 2,
				retryDelay: 300,
				retryStatusCodes: [500, 502, 503] // Don't include 401 to force failure
			});

			let output = 'Demonstrating retry behavior with auth failure (shows multiple onRequest calls):\n\n';
			let attemptCount = 0;

			// Authentication interceptor - runs on EVERY attempt
			api.use({
				onRequest(context) {
					attemptCount++;
					const token = `attempt-${context.attempt}-token-${Date.now()}`;
					
					context.req.headers = {
						...(context.req.headers || {}),
						'Authorization': `Bearer ${token}`,
						'X-Attempt': context.attempt.toString()
					};
					
					const msg = `🔑 [Auth] Attempt ${context.attempt}: Generated new token: ${token}`;
					output += msg + '\n';
					updateOutput(output);
					
					context.meta.tokenUsed = token;
				},
				onResponseError(context) {
					const msg = `🔑 [Auth] Auth failed with token: ${context.meta.tokenUsed} (attempt ${context.attempt})`;
					output += msg + '\n';
					updateOutput(output);
				}
			});

			output += '\n📡 Making request to /status/500 (will retry but ultimately fail)...\n\n';
			updateOutput(output);

			try {
				const response = await api.getJson('/status/500');
				output += '\n✅ Unexpected success!\n';
				updateOutput(output);
				return output;
			} catch (error) {
				output += `\n❌ Final error after all retries: ${error.message}\n`;
				output += `Total onRequest calls made: ${attemptCount}\n\n`;
				output += '💡 This shows that onRequest interceptors run on EVERY retry attempt,\n';
				output += 'allowing fresh authentication tokens to be generated for each try.\n';
				updateOutput(output);
				return output;
			}
		}
	},

	{
		id: 'abort-controller',
		title: 'AbortController Integration',
		run: async (updateOutput, signal) => {
			const { createLuminara } = await import('../../dist/index.mjs');
			
			const api = createLuminara({
				baseURL: 'https://httpbin.org',
				timeout: 5000
			});

			let output = 'Demonstrating AbortController integration in context:\n\n';

			// Interceptor with timeout logic
			api.use({
				onRequest(context) {
					const msg = `⏰ [Timeout] Setting up 2-second timeout for demonstration`;
					output += msg + '\n';
					updateOutput(output);
					
					// Cancel request after 2 seconds for demo
					setTimeout(() => {
						output += '⏰ [Timeout] 2 seconds elapsed, aborting request...\n';
						updateOutput(output);
						context.controller.abort();
					}, 2000);
				},
				onResponseError(context) {
					if (context.error.name === 'AbortError') {
						const msg = `🚫 [Timeout] Request was aborted by interceptor`;
						output += msg + '\n';
						updateOutput(output);
					}
				}
			});

			// Progress tracking interceptor
			api.use({
				onRequest(context) {
					const msg = `📊 [Progress] Request started with AbortController`;
					output += msg + '\n';
					updateOutput(output);
					
					context.meta.startTime = Date.now();
				},
				onResponseError(context) {
					const duration = Date.now() - context.meta.startTime;
					const msg = `📊 [Progress] Request cancelled after ${duration}ms`;
					output += msg + '\n';
					updateOutput(output);
				}
			});

			output += '\n📡 Making request to /delay/10 (10 second delay, will be aborted)...\n\n';
			updateOutput(output);

			try {
				const response = await api.getJson('/delay/10');
				
				output += '\n✅ This should not happen - request should be aborted!\n';
				updateOutput(output);
				return output;
			} catch (error) {
				if (error.name === 'AbortError') {
					output += '\n🚫 Request successfully aborted by interceptor!\n';
					output += 'This demonstrates how interceptors can access and control the AbortController.\n';
				} else {
					output += `\n❌ Unexpected error: ${error.message}\n`;
				}
				updateOutput(output);
				return output;
			}
		}
	}
];