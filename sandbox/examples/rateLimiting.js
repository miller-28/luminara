/**
 * Rate Limiting Examples
 * 
 * Interactive examples demonstrating Luminara's internal rate limiting feature.
 * Shows token bucket behavior, scoping, configuration patterns, and real-time statistics.
 */

export const rateLimitingExamples = {
	title: 'Rate Limiting',
	examples: [
		{
			id: 'rate-limit-test-simple',
			title: 'Simple Rate Limit Test',
			description: 'Basic test: 1 request per second with 2 sequential requests',
			run: async (updateOutput, signal, options = {}) => {
				updateOutput('🔧 Testing basic rate limiting: 1 RPS...\n');
				
				try {
					const { createLuminara } = await import('../../dist/index.mjs');
					
					// Use a reliable CORS-friendly endpoint
					updateOutput('⚙️ Creating Luminara client with rate limiting...\n');
					const api = createLuminara({ 
						baseURL: 'https://jsonplaceholder.typicode.com',
						verbose: options.verbose || false,
						rateLimit: { 
							rps: 1,
							verbose: options.verbose || false
						}
					});
					
					updateOutput('✅ Client created successfully\n');
					updateOutput('⏱️ Making first request...\n');
					const startTime = Date.now();
					
					await api.getJson('/todos/1', { signal });
					const firstTime = Date.now() - startTime;
					updateOutput(`✅ First request completed in ${firstTime}ms\n`);
					
					updateOutput('⏱️ Making second request (should be delayed)...\n');
					const secondStartTime = Date.now();
					
					await api.getJson('/todos/2', { signal });
					const secondTime = Date.now() - secondStartTime;
					const totalTime = Date.now() - startTime;
					
					updateOutput(`✅ Second request completed in ${secondTime}ms\n`);
					updateOutput(`⏰ Total time: ${totalTime}ms\n`);
					
					if (totalTime > 900) {
						updateOutput(`✅ Rate limiting working! Requests were delayed appropriately.\n`);
					} else {
						updateOutput(`⚠️ Rate limiting may not be working. Total time too short: ${totalTime}ms\n`);
					}
					
					return '✅ Simple rate limit test completed';
				} catch (error) {
					updateOutput(`❌ Error: ${error.message}\n`);
					updateOutput(`🔍 Error name: ${error.name}\n`);
					updateOutput(`🔍 Stack: ${error.stack}\n`);
					
					if (error.message.includes('Illegal invocation')) {
						updateOutput(`� This indicates a browser compatibility issue with URL parsing.\n`);
						updateOutput(`🔧 The error has been reported and should be fixed.\n`);
					}
					throw error;
				}
			}
		},
		{
			id: 'rate-limit-basic',
			title: '2 Requests Per Second',
			description: 'Basic rate limiting with 2 RPS - watch timing between requests',
			run: async (updateOutput, signal, options = {}) => {
				updateOutput('🔧 Setting up rate limiting: 2 requests per second...\n');
				
				try {
					const { createLuminara } = await import('../../dist/index.mjs');
					const api = createLuminara({ 
						baseURL: 'https://jsonplaceholder.typicode.com',
						verbose: options.verbose || false,
						rateLimit: { 
							rps: 2,
							verbose: options.verbose || false
						}
					});
					
					updateOutput('⏱️ Sending 4 requests quickly - should be throttled...\n');
					const startTime = Date.now();
					
					const requests = [];
					for (let i = 1; i <= 4; i++) {
						// Check if aborted before starting request
						if (signal.aborted) {
							throw new Error('Operation was aborted');
						}
						
						const promise = api.getJson(`/posts/${i}`, { signal }).then(response => {
							const elapsed = Date.now() - startTime;
							updateOutput(`✅ Request ${i} completed after ${elapsed}ms\n`);
							return response;
						}).catch(error => {
							const elapsed = Date.now() - startTime;
							if (error.name === 'AbortError') {
								updateOutput(`⏹ Request ${i} aborted after ${elapsed}ms\n`);
							} else {
								updateOutput(`❌ Request ${i} failed after ${elapsed}ms: ${error.message}\n`);
							}
							throw error;
						});
						requests.push(promise);
						updateOutput(`🚀 Request ${i} sent at ${Date.now() - startTime}ms\n`);
					}
					
					await Promise.allSettled(requests);
					const totalTime = Date.now() - startTime;
					updateOutput(`\n⏰ Total time: ${totalTime}ms (expected ~1500ms for 4 requests at 2 RPS)\n`);
					
					return '✅ Rate limiting demo completed';
				} catch (error) {
					updateOutput(`❌ Error: ${error.message}\n`);
					throw error;
				}
			}
		},
		{
			id: 'rate-limit-burst',
			title: 'Token Bucket with Burst',
			description: 'Demonstrates burst capacity - immediate requests when tokens available',
			run: async (updateOutput, signal, options = {}) => {
				updateOutput('🔧 Setting up token bucket: 1 RPS with burst capacity of 3...\n');
				
				try {
					const { createLuminara } = await import('../../dist/index.mjs');
					const api = createLuminara({ 
						baseURL: 'https://jsonplaceholder.typicode.com',
						verbose: options.verbose || false,
						rateLimit: { 
							rps: 1,
							burst: 3,
							verbose: options.verbose || false
						}
					});
					
					updateOutput('💥 Sending burst of 3 requests (should be immediate)...\n');
					const burstStart = Date.now();
					
					const burstRequests = [];
					for (let i = 1; i <= 3; i++) {
						// Check if aborted before starting request
						if (signal.aborted) {
							throw new Error('Operation was aborted');
						}
						
						const promise = api.getJson(`/posts/${i}`, { signal }).then(response => {
							const elapsed = Date.now() - burstStart;
							updateOutput(`✅ Burst request ${i} completed after ${elapsed}ms\n`);
							return response;
						}).catch(error => {
							if (error.name === 'AbortError') {
								updateOutput(`⏹ Burst request ${i} aborted\n`);
							} else {
								updateOutput(`❌ Burst request ${i} failed: ${error.message}\n`);
							}
							throw error;
						});
						burstRequests.push(promise);
					}
					
					await Promise.allSettled(burstRequests);
					const burstTime = Date.now() - burstStart;
					updateOutput(`💨 Burst completed in ${burstTime}ms (tokens consumed)\n\n`);
					
					// Check if aborted before delayed request
					if (signal.aborted) {
						throw new Error('Operation was aborted');
					}
					
					updateOutput('⏳ Now sending 4th request (should wait for token refill)...\n');
					const delayStart = Date.now();
					
					try {
						await api.getJson('/posts/4', { signal });
						const delayTime = Date.now() - delayStart;
						updateOutput(`✅ Delayed request completed after ${delayTime}ms (waited for refill)\n`);
					} catch (error) {
						if (error.name === 'AbortError') {
							updateOutput(`⏹ Delayed request aborted\n`);
						} else {
							updateOutput(`❌ Delayed request failed: ${error.message}\n`);
						}
					}
					
					return '✅ Token bucket burst demo completed';
				} catch (error) {
					updateOutput(`❌ Error: ${error.message}\n`);
					throw error;
				}
			}
		},
		{
			id: 'rate-limit-scoping',
			title: 'Global vs Domain Scoping',
			description: 'Shows how rate limiting applies to different scopes',
			run: async (updateOutput, signal, options = {}) => {
				updateOutput('🔧 Setting up global scope rate limiting...\n');
				
				try {
					const { createLuminara } = await import('../../dist/index.mjs');
					const globalApi = createLuminara({ 
						baseURL: 'https://jsonplaceholder.typicode.com',
						verbose: options.verbose || false,
						rateLimit: { 
							rps: 1,
							scope: 'global',
							verbose: options.verbose || false
						}
					});
					
					updateOutput('🌍 Testing global scope - all endpoints share same limit...\n');
					const globalStart = Date.now();
					
					const globalRequests = [
						globalApi.getJson('/posts/1', { signal }),
						globalApi.getJson('/users/1', { signal }),
						globalApi.getJson('/comments/1', { signal })
					];
					
					await Promise.allSettled(globalRequests.map((promise, index) => 
						promise.then(response => {
							const elapsed = Date.now() - globalStart;
							updateOutput(`✅ Global request ${index + 1} completed after ${elapsed}ms\n`);
						}).catch(error => {
							if (error.name === 'AbortError') {
								updateOutput(`⏹ Global request ${index + 1} aborted\n`);
							} else {
								updateOutput(`❌ Global request ${index + 1} failed: ${error.message}\n`);
							}
						})
					));
					
					const globalTime = Date.now() - globalStart;
					updateOutput(`🌍 Global scope total time: ${globalTime}ms\n\n`);
					
					return '✅ Scoping demo completed';
				} catch (error) {
					updateOutput(`❌ Error: ${error.message}\n`);
					throw error;
				}
			}
		},
		
		{
			id: 'rate-limit-debug',
			title: 'Rate Limiting Debug Test',
			description: 'Comprehensive test to verify rate limiting works correctly',
			run: async (updateOutput, signal, options = {}) => {
				try {
					updateOutput('🔧 Running comprehensive debug test for rate limiting...\n');
					
					const { createLuminara } = await import('../../dist/index.mjs');
					
					// Test if we can create a client with rate limiting
				updateOutput('🔍 Creating Luminara client with rate limiting...\n');
				const api = createLuminara({ 
					baseURL: 'https://jsonplaceholder.typicode.com',
					verbose: options.verbose || false,
					rateLimit: { 
						rps: 1,
						verbose: options.verbose || false
					}
				});					updateOutput('✅ Client created successfully\n');
					
					// Check if rate limiting stats API is available
					updateOutput('🔍 Testing rate limiting stats API...\n');
					try {
						const initialStats = api.getRateLimitStats();
						if (initialStats) {
							updateOutput(`✅ Rate limiting stats available: ${JSON.stringify(initialStats, null, 2)}\n`);
						} else {
							updateOutput('❌ Rate limiting stats not available\n');
						}
					} catch (error) {
						updateOutput(`❌ Rate limiting stats error: ${error.message}\n`);
					}
					
					updateOutput('🔍 Testing requests with timing measurement...\n');
					const startTime = Date.now();
					
				// Test two requests that should be rate limited
				updateOutput('🚀 Sending request 1...\n');
				const req1Start = Date.now();
				await api.getJson('/todos/1', { signal });
				const req1Time = Date.now() - req1Start;
				updateOutput(`✅ Request 1 completed after ${req1Time}ms\n`);
				
				updateOutput('🚀 Sending request 2 (should be delayed)...\n');
				const req2Start = Date.now();
				await api.getJson('/todos/2', { signal });
					const req2Time = Date.now() - req2Start;
					updateOutput(`✅ Request 2 completed after ${req2Time}ms\n`);
					
					const totalTime = Date.now() - startTime;
					updateOutput(`\n⏰ Total time: ${totalTime}ms\n`);
					
					// Check final stats
					try {
						const finalStats = api.getRateLimitStats();
						if (finalStats) {
							updateOutput(`📊 Final stats: ${JSON.stringify(finalStats, null, 2)}\n`);
						}
					} catch (error) {
						updateOutput(`❌ Final stats error: ${error.message}\n`);
					}
					
					if (totalTime > 900) {
						updateOutput(`✅ SUCCESS: Rate limiting is working correctly!\n`);
					} else {
						updateOutput(`⚠️ WARNING: Rate limiting may not be active (total time: ${totalTime}ms, expected: >1000ms)\n`);
					}
					
					return '✅ Comprehensive debug test completed';
				} catch (error) {
					updateOutput(`❌ Debug test error: ${error.message}\n`);
					updateOutput(`🔍 Error name: ${error.name}\n`);
					updateOutput(`🔍 Stack trace:\n${error.stack}\n`);
					
					if (error.message.includes('Illegal invocation')) {
						updateOutput(`\n🔧 DIAGNOSIS: "Illegal invocation" suggests URL parsing issues in browser.\n`);
						updateOutput(`🔧 This has been identified and fixed. Please refresh and try again.\n`);
					}
					
					throw error;
				}
			}
		}
	]
};

export default rateLimitingExamples;