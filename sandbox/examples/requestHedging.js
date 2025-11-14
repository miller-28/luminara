import { createLuminara } from '../../dist/index.mjs';

export const requestHedging = {
	title: '🏎️ Request Hedging',
	examples: [
		{
			id: 'hedging-basic-race',
			title: 'Basic Race Policy',
			description: 'Send concurrent hedge requests to reduce tail latency',
			code: `import { createLuminara } from 'luminara';

const client = createLuminara({
  hedging: {
    policy: 'race',        // Concurrent execution
    hedgeDelay: 2000,      // Send hedge after 2s
    maxHedges: 2           // Up to 2 additional requests
  }
});

// If primary is slow, hedges kick in automatically
const response = await client.get('https://api.example.com/data');`,
			run: async (updateOutput, signal, options = {}) => {
				const hedgeLog = [];
				const startTime = Date.now();
				
				const logEvent = (message) => {
					const elapsed = Date.now() - startTime;
					hedgeLog.push(`[T+${elapsed}ms] ${message}`);
					
					if (updateOutput) {
						updateOutput(
							'Policy: Race (Concurrent)\n' +
							'Hedge Delay: 2000ms\n' +
							'Max Hedges: 2\n' +
							'Endpoint: /delay/3 (3 second delay)\n\n' +
							`📊 Hedging Timeline:\n${hedgeLog.join('\n')}\n\n` +
							'⏳ In progress...'
						);
					}
				};
				
				const client = createLuminara({ 
					verbose: options.verbose || false,
					hedging: {
						policy: 'race',
						hedgeDelay: 2000,
						maxHedges: 2
					}
				});				// Track hedging events
				client.use({
					onRequest: (context) => {
						if (context.hedging?.type === 'primary') {
							logEvent('🚀 Primary request sent');
						} else if (context.hedging?.type?.startsWith('hedge')) {
							logEvent(`🏃 ${context.hedging.type} triggered (concurrent)`);
						}
						return context;
					},
					onResponse: (context) => {
						if (context.hedging?.winner) {
							const winner = context.hedging.winner;
							const latencySaved = context.hedging.latencySaved || 0;
							logEvent(`✅ ${winner} won the race! (saved ${latencySaved}ms)`);
						}
						return context;
					}
				});
				
				try {
					const response = await client.get('https://httpbingo.org/delay/3', { signal });
					
					const totalTime = Date.now() - startTime;
					logEvent(`🎯 Request completed in ${totalTime}ms`);
					
					return (
						'Policy: Race (Concurrent)\n' +
						'Hedge Delay: 2000ms\n' +
						'Max Hedges: 2\n' +
						'Endpoint: /delay/3 (3 second delay)\n\n' +
						`📊 Hedging Timeline:\n${hedgeLog.join('\n')}\n\n` +
						`✨ Total time: ${totalTime}ms\n` +
						'💡 Race policy sends multiple concurrent requests\n' +
						'   First successful response wins!'
					);
				} catch (error) {
					if (error.name === 'AbortError') {
						throw error;
					}
					return `❌ Error: ${error.message}`;
				}
			}
		},
		{
			id: 'hedging-cancel-retry',
			title: 'Cancel-and-Retry Policy',
			description: 'Sequential execution with cancellation between attempts',
			code: `import { createLuminara } from 'luminara';

const client = createLuminara({
  hedging: {
    policy: 'cancel-and-retry',  // Sequential with cancellation
    hedgeDelay: 1500,             // Wait 1.5s before cancelling
    maxHedges: 2
  }
});

// Cancels slow requests and retries with fresh attempts
const response = await client.get('https://api.example.com/data');`,
			run: async (updateOutput, signal, options = {}) => {
				const hedgeLog = [];
				const startTime = Date.now();
				
				const logEvent = (message) => {
					const elapsed = Date.now() - startTime;
					hedgeLog.push(`[T+${elapsed}ms] ${message}`);
					
					if (updateOutput) {
						updateOutput(
							'Policy: Cancel-and-Retry (Sequential)\n' +
							'Hedge Delay: 1500ms\n' +
							'Max Hedges: 2\n' +
							'Endpoint: /delay/2 (2 second delay)\n\n' +
							`📊 Hedging Timeline:\n${hedgeLog.join('\n')}\n\n` +
							'⏳ In progress...'
						);
					}
				};
				
				const client = createLuminara({ 
					verbose: options.verbose || false,
					hedging: {
						policy: 'cancel-and-retry',
						hedgeDelay: 1500,
						maxHedges: 2
					}
				});				
				client.use({
					onRequest: (context) => {
						if (context.hedging?.type === 'primary') {
							logEvent('🚀 Primary request sent');
						} else if (context.hedging?.type?.startsWith('hedge')) {
							logEvent(`🔄 Previous request cancelled, ${context.hedging.type} sent`);
						}
						return context;
					},
					onResponse: (context) => {
						if (context.hedging?.winner) {
							logEvent(`✅ ${context.hedging.winner} completed successfully`);
						}
						return context;
					}
				});
				
				try {
					const response = await client.get('https://httpbingo.org/delay/2', { signal });
					
					const totalTime = Date.now() - startTime;
					logEvent(`🎯 Request completed in ${totalTime}ms`);
					
					return (
						'Policy: Cancel-and-Retry (Sequential)\n' +
						'Hedge Delay: 1500ms\n' +
						'Max Hedges: 2\n' +
						'Endpoint: /delay/2 (2 second delay)\n\n' +
						`📊 Hedging Timeline:\n${hedgeLog.join('\n')}\n\n` +
						`✨ Total time: ${totalTime}ms\n` +
						'💡 Cancel-and-retry cancels slow requests\n' +
						'   and retries sequentially'
					);
				} catch (error) {
					if (error.name === 'AbortError') {
						throw error;
					}
					return `❌ Error: ${error.message}`;
				}
			}
		},
		{
			id: 'hedging-http-methods',
			title: 'HTTP Method Whitelist',
			description: 'Only idempotent methods are hedged by default',
			code: `import { createLuminara } from 'luminara';

const client = createLuminara({
  hedging: {
    policy: 'race',
    hedgeDelay: 1000,
    // Default: ['GET', 'HEAD', 'OPTIONS']
    includeHttpMethods: ['GET', 'HEAD', 'OPTIONS', 'POST']
  }
});

// GET request - will be hedged (safe)
await client.get('https://api.example.com/data');

// POST request - NOT hedged by default (not idempotent)
await client.post('https://api.example.com/data', { value: 42 });

// But if you add POST to includeHttpMethods, it will be hedged`,
			run: async (updateOutput, signal, options = {}) => {
				const results = [];
				
				// Test 1: GET with hedging (default whitelist)
				const client1 = createLuminara({
					hedging: {
						policy: 'race',
						hedgeDelay: 500,
						maxHedges: 1
					}
				});				let getHedged = false;
				client1.use({
					onRequest: (context) => {
						if (context.hedging?.type?.startsWith('hedge')) {
							getHedged = true;
						}
						return context;
					}
				});
				
				results.push('🔍 Testing GET request with default whitelist:');
				try {
					await client1.get('https://httpbingo.org/delay/1', { signal });
					results.push(`   ✅ GET: ${getHedged ? 'Hedged (as expected)' : 'Not hedged'}`);
				} catch (error) {
					if (error.name === 'AbortError') {
						throw error;
					}
				}
				
				// Test 2: POST without hedging (default whitelist)
				const client2 = createLuminara({
					hedging: {
						policy: 'race',
						hedgeDelay: 500,
						maxHedges: 1
					}
				});				let postHedged = false;
				client2.use({
					onRequest: (context) => {
						if (context.hedging?.type?.startsWith('hedge')) {
							postHedged = true;
						}
						return context;
					}
				});
				
				results.push('');
				results.push('🔍 Testing POST request with default whitelist:');
				try {
					await client2.post('https://httpbingo.org/delay/1', { test: 'data' }, { signal });
					results.push(`   ✅ POST: ${postHedged ? 'Hedged' : 'Not hedged (as expected)'}`);
				} catch (error) {
					if (error.name === 'AbortError') {
						throw error;
					}
				}
				
				results.push('');
				results.push('📋 Default Whitelist:');
				results.push('   • GET     ✅ Hedged');
				results.push('   • HEAD    ✅ Hedged');
				results.push('   • OPTIONS ✅ Hedged');
				results.push('   • POST    ❌ Not hedged (not idempotent)');
				results.push('   • PUT     ❌ Not hedged (not idempotent)');
				results.push('   • DELETE  ❌ Not hedged (not idempotent)');
				results.push('');
				results.push('💡 Customize with includeHttpMethods option');
				results.push('   to hedge non-idempotent methods if safe');
				
				return results.join('\n');
			}
		},
		{
			id: 'hedging-exponential-backoff',
			title: 'Exponential Backoff & Jitter',
			description: 'Increase delay between hedges with randomization',
			code: `import { createLuminara } from 'luminara';

const client = createLuminara({
  hedging: {
    policy: 'race',
    hedgeDelay: 500,              // Base: 500ms
    maxHedges: 3,
    exponentialBackoff: true,     // Enable backoff
    backoffMultiplier: 2,         // 2x each time
    jitter: true,                 // Add randomness
    jitterRange: 0.3              // ±30%
  }
});

// Hedge timing with backoff:
// - Primary:  0ms
// - Hedge 1:  ~500ms  (500 ± 30%)
// - Hedge 2:  ~1000ms (1000 ± 30%)
// - Hedge 3:  ~2000ms (2000 ± 30%)`,
			run: async (updateOutput, signal, options = {}) => {
				const hedgeLog = [];
				const startTime = Date.now();
				const hedgeTimes = [];
				
				const logEvent = (message) => {
					const elapsed = Date.now() - startTime;
					hedgeLog.push(`[T+${elapsed}ms] ${message}`);
					
					if (updateOutput) {
						updateOutput(
							'Exponential Backoff Configuration:\n' +
							'Base Delay: 500ms\n' +
							'Backoff Multiplier: 2x\n' +
							'Jitter: ±30%\n' +
							'Max Hedges: 3\n\n' +
							`📊 Hedge Timeline:\n${hedgeLog.join('\n')}\n\n` +
							'⏳ In progress...'
						);
					}
				};
				
				const client = createLuminara({ 
					verbose: options.verbose || false,
					hedging: {
						policy: 'race',
						hedgeDelay: 500,
						maxHedges: 3,
						exponentialBackoff: true,
						backoffMultiplier: 2,
						jitter: true,
						jitterRange: 0.3
					}
				});				client.use({
					onRequest: (context) => {
						const elapsed = Date.now() - startTime;
						if (context.hedging?.type === 'primary') {
							logEvent('🚀 Primary request sent');
							hedgeTimes.push({ type: 'primary', time: 0 });
						} else if (context.hedging?.type?.startsWith('hedge')) {
							const hedgeNum = context.hedging.index;
							logEvent(`🏃 Hedge #${hedgeNum} sent (with backoff + jitter)`);
							hedgeTimes.push({ type: `hedge-${hedgeNum}`, time: elapsed });
						}
						return context;
					},
					onResponse: (context) => {
						if (context.hedging?.winner) {
							logEvent(`✅ ${context.hedging.winner} won!`);
						}
						return context;
					}
				});
				
				try {
					await client.get('https://httpbingo.org/delay/3', { signal });
					
					const totalTime = Date.now() - startTime;
					logEvent(`🎯 Completed in ${totalTime}ms`);
					
					// Calculate actual backoff timing
					const timingAnalysis = hedgeTimes.map((h, i) => {
						if (i === 0) {
							return `   ${h.type}: ${h.time}ms`;
						}
						const expected = 500 * Math.pow(2, i - 1);
						const jitterMin = Math.floor(expected * 0.7);
						const jitterMax = Math.ceil(expected * 1.3);
						return `   ${h.type}: ${h.time}ms (expected ${jitterMin}-${jitterMax}ms)`;
					});
					
					return (
						'Exponential Backoff Configuration:\n' +
						'Base Delay: 500ms\n' +
						'Backoff Multiplier: 2x\n' +
						'Jitter: ±30%\n' +
						'Max Hedges: 3\n\n' +
						`📊 Hedge Timeline:\n${hedgeLog.join('\n')}\n\n` +
						`⏱️ Actual Timing:\n${timingAnalysis.join('\n')}\n\n` +
						'💡 Exponential backoff prevents thundering herd\n' +
						'   Jitter adds randomness to avoid collisions'
					);
				} catch (error) {
					if (error.name === 'AbortError') {
						throw error;
					}
					return `❌ Error: ${error.message}`;
				}
			}
		},
		{
			id: 'hedging-per-request',
			title: 'Per-Request Configuration',
			description: 'Override hedging settings for specific requests',
			code: `import { createLuminara } from 'luminara';

// Global hedging enabled
const client = createLuminara({
  hedging: {
    policy: 'race',
    hedgeDelay: 2000,
    maxHedges: 2
  }
});

// Disable hedging for specific request
await client.get('/critical', {
  hedging: { enabled: false }
});

// Override policy for specific request
await client.get('/fast-lane', {
  hedging: {
    policy: 'race',
    hedgeDelay: 500,   // Faster hedging
    maxHedges: 1
  }
});`,
			run: async (updateOutput, signal, options = {}) => {
				const results = [];
				
				// Scenario 1: Global enabled, per-request disable
				results.push('🔧 Scenario 1: Global hedging enabled, disable per-request');
				results.push('');
				
				const client1 = createLuminara({
					hedging: {
						policy: 'race',
						hedgeDelay: 1000,
						maxHedges: 2
					}
				});				let hedgeCount1 = 0;
				client1.use({
					onRequest: (context) => {
						if (context.hedging?.type?.startsWith('hedge') && context.req.url.includes('delay/1')) {
							hedgeCount1++;
						}
						return context;
					}
				});
				
				results.push('   Global: { policy: race, hedgeDelay: 1000ms }');
				try {
					await client1.get('https://httpbingo.org/delay/1', { signal });
					results.push(`   Request (no override): ✅ Hedged (${hedgeCount1} hedges)`);
				} catch (error) {
					if (error.name === 'AbortError') {
						throw error;
					}
				}
				
				let hedgeCount2 = 0;
				client1.use({
					onRequest: (context) => {
						if (context.hedging?.type?.startsWith('hedge') && context.req.url.includes('json')) {
							hedgeCount2++;
						}
						return context;
					}
				});
				
				try {
					await client1.get('https://httpbingo.org/json', { 
						signal,
						hedging: { enabled: false }
					});
					results.push(`   Request { hedging: { enabled: false } }: ✅ Disabled (${hedgeCount2} hedges)`);
				} catch (error) {
					if (error.name === 'AbortError') {
						throw error;
					}
				}
				
				results.push('');
				
				// Scenario 2: Global disabled, per-request enable
				results.push('🔧 Scenario 2: No global hedging, enable per-request');
				results.push('');
				
				const client2 = createLuminara({ baseURL: 'https://httpbingo.org' });				let hedgeCount3 = 0;
				client2.use({
					onRequest: (context) => {
						if (context.hedging?.type?.startsWith('hedge') && context.req.url.includes('uuid')) {
							hedgeCount3++;
						}
						return context;
					}
				});
				
				results.push('   Global: (no hedging config)');
				try {
					await client2.get('/uuid', { signal });
					results.push(`   Request (no override): ✅ Not hedged (${hedgeCount3} hedges)`);
				} catch (error) {
					if (error.name === 'AbortError') {
						throw error;
					}
				}
				
				let hedgeCount4 = 0;
				client2.use({
					onRequest: (context) => {
						if (context.hedging?.type?.startsWith('hedge') && context.req.url.includes('delay/1')) {
							hedgeCount4++;
						}
						return context;
					}
				});
				
				try {
					await client2.get('/delay/1', { 
						signal,
						hedging: {
							policy: 'race',
							hedgeDelay: 500,
							maxHedges: 1
						}
					});
					results.push(`   Request { hedging: {...} }: ✅ Hedged (${hedgeCount4} hedges)`);
				} catch (error) {
					if (error.name === 'AbortError') {
						throw error;
					}
				}
				
				results.push('');
				results.push('💡 Bidirectional Override Support:');
				results.push('   ✓ Global enabled → per-request disable');
				results.push('   ✓ Global disabled → per-request enable');
				results.push('   ✓ Per-request can change policy, timing, etc.');
				results.push('');
				results.push('Useful for:');
				results.push('   • Critical requests requiring unique execution');
				results.push('   • Fast endpoints that don\'t need hedging');
				results.push('   • A/B testing different hedging strategies');
				
				return results.join('\n');
			}
		},
		{
			id: 'hedging-server-rotation',
			title: 'Server Rotation',
			description: 'Distribute hedges across multiple servers',
			code: `import { createLuminara } from 'luminara';

const client = createLuminara({
  hedging: {
    policy: 'race',
    hedgeDelay: 1000,
    maxHedges: 2,
    servers: [
      'https://api1.example.com',
      'https://api2.example.com',
      'https://api3.example.com'
    ]
  }
});

// Each hedge goes to a different server:
// - Primary: api1.example.com
// - Hedge 1: api2.example.com
// - Hedge 2: api3.example.com`,
			run: async (updateOutput, signal, options = {}) => {
				const results = [];
				
				results.push('🌐 Server Rotation Configuration:');
				results.push('');
				results.push('servers: [');
				results.push('  "https://api1.example.com",');
				results.push('  "https://api2.example.com",');
				results.push('  "https://api3.example.com"');
				results.push(']');
				results.push('');
				results.push('📊 Request Distribution:');
				results.push('   • Primary → api1.example.com');
				results.push('   • Hedge 1 → api2.example.com');
				results.push('   • Hedge 2 → api3.example.com');
				results.push('');
				results.push('✨ Benefits:');
				results.push('   • Load distribution across servers');
				results.push('   • Fault tolerance (one server down)');
				results.push('   • Geographic optimization');
				results.push('   • Reduced tail latency');
				results.push('');
				results.push('💡 Algorithm:');
				results.push('   • Domain detection for smart rotation');
				results.push('   • Falls back to same server if no list');
				results.push('   • Round-robin distribution');
				results.push('');
				results.push('⚠️ Note: Server rotation requires:');
				results.push('   • Replicated data across servers');
				results.push('   • Consistent API responses');
				results.push('   • Idempotent operations');
				
				return results.join('\n');
			}
		},
		{
			id: 'hedging-latency-optimization',
			title: 'Real-World Latency Optimization',
			description: 'Reduce P99 latency in production scenarios',
			code: `import { createLuminara } from 'luminara';

// Scenario: API with variable latency
// - P50: 200ms (fast)
// - P95: 1500ms (slow)
// - P99: 3000ms (very slow)

const client = createLuminara({
  hedging: {
    policy: 'race',
    hedgeDelay: 1500,    // Target P95
    maxHedges: 1,
    exponentialBackoff: true,
    jitter: true
  }
});

// Without hedging: P99 = 3000ms
// With hedging:    P99 = ~1500ms (50% reduction!)`,
			run: async (updateOutput, signal, options = {}) => {
				const results = [];
				const startTime = Date.now();
				
				results.push('🎯 Latency Optimization Scenario');
				results.push('');
				results.push('API Latency Profile:');
				results.push('   P50 (median):  200ms  ⚡');
				results.push('   P95:          1500ms  🐢');
				results.push('   P99:          3000ms  🐌');
				results.push('');
				results.push('Hedging Configuration:');
				results.push('   Policy: race');
				results.push('   Hedge Delay: 1500ms (targets P95)');
				results.push('   Max Hedges: 1');
				results.push('');
				
				const hedgeLog = [];
				const logEvent = (msg) => {
					const elapsed = Date.now() - startTime;
					hedgeLog.push(`[T+${elapsed}ms] ${msg}`);
				};
				
				const client = createLuminara({
					hedging: {
						policy: 'race',
						hedgeDelay: 1500,
						maxHedges: 1
					}
				});				   client.use({
					   onRequest: (context) => {
						   if (context.hedging?.type === 'primary') {
							   logEvent('Primary request sent');
						   } else if (context.hedging?.type?.startsWith('hedge')) {
							   logEvent('Hedge request sent (primary still pending)');
						   }
						   if (options.verbose) {
							   console.info('[HEDGING][Latency Optimization] onRequest', context);
						   }
						   return context;
					   },
					   onResponse: (context) => {
						   if (context.hedging?.winner) {
							   const saved = context.hedging.latencySaved || 0;
							   logEvent(`${context.hedging.winner} won (saved ${saved}ms)`);
						   }
						   if (options.verbose) {
							   console.info('[HEDGING][Latency Optimization] onResponse', context);
						   }
						   return context;
					   }
				   });
				
				results.push('🏃 Running hedged request...\n');
				if (updateOutput) {
					updateOutput(results.join('\n') + '⏳ In progress...');
				}
				
				try {
					await client.get('https://httpbingo.org/delay/2', { signal });
					
					const totalTime = Date.now() - startTime;
					
					results.push('📊 Execution Timeline:');
					hedgeLog.forEach(log => results.push(`   ${log}`));
					results.push('');
					results.push(`⏱️ Total Time: ${totalTime}ms`);
					results.push('');
					results.push('✨ Impact on P99 Latency:');
					results.push('   Without hedging: ~3000ms');
					results.push(`   With hedging:    ~${totalTime}ms`);
					results.push(`   Improvement:     ${Math.floor((1 - totalTime/3000) * 100)}%`);
					results.push('');
					results.push('💡 Key Takeaway:');
					results.push('   Hedging dramatically reduces tail latency');
					results.push('   by racing slow requests against fresh ones.');
					results.push('   Critical for user-facing applications!');
					
					return results.join('\n');
				} catch (error) {
					if (error.name === 'AbortError') {
						throw error;
					}
					return results.join('\n') + '\n\n❌ Error: ' + error.message;
				}
			}
		   },
		   {
			   id: 'hedging-vs-retry',
			   title: 'Hedging vs Retry Correlation',
			   description: 'Demonstrate the difference and interplay between hedging and retry. One config has retry enabled and hedging disabled, the other has hedging enabled and retry disabled. Shows how each handles latency and errors.',
			   code: `import { createLuminara } from 'luminara';

// Config 1: Retry enabled, Hedging disabled
const clientRetry = createLuminara({
    retry: 2,
    retryDelay: 1000,
    hedging: { enabled: false }
});

// Config 2: Hedging enabled, Retry disabled
// Note: retry can be disabled with false or 0
const clientHedge = createLuminara({
  retry: false,  // or retry: 0
  hedging: {
    policy: 'race',
    hedgeDelay: 1000,
    maxHedges: 1
  }
});	// Simulate a flaky endpoint (50% error, 50% slow)
	// Run both configs and compare results
	`,
			   run: async (updateOutput, signal, options = {}) => {
				   const results = [];
				   const endpoint = 'https://httpbingo.org/delay/2';
				   results.push('🔁 Config 1: Retry enabled, Hedging disabled');
				   const clientRetry = createLuminara({
					   retry: 2,
					   retryDelay: 1000,
					   verbose: options.verbose || false,
					   hedging: { enabled: false }
				   });
				   let retryAttempts = 0;
				   clientRetry.use({
					   onRequest: () => {
						retryAttempts++; return undefined; 
					}
				   });
				   let retryResult, retryTime;
				   const retryStart = Date.now();
				   try {
					   await clientRetry.get(endpoint, { signal });
					   retryTime = Date.now() - retryStart;
					   retryResult = `✅ Success in ${retryTime}ms (${retryAttempts} attempts)`;
				   } catch (e) {
					   retryTime = Date.now() - retryStart;
					   retryResult = `❌ Failed after ${retryTime}ms (${retryAttempts} attempts): ${e.message}`;
				   }
				   results.push('   ' + retryResult);

			   results.push('');
			   results.push('🏎️ Config 2: Hedging enabled, Retry disabled');
			   const clientHedge = createLuminara({
				   retry: 0,
				   verbose: options.verbose || false,
				   hedging: {
					   policy: 'race',
					   hedgeDelay: 1000,
					   maxHedges: 1
				   }
			   });
			   let hedgeAttempts = 0;
				   clientHedge.use({
					   onRequest: (context) => {
						   if (context.hedging?.type) {
							hedgeAttempts++;
						}
						   return context;
					   }
				   });
				   let hedgeResult, hedgeTime;
				   const hedgeStart = Date.now();
				   try {
					   await clientHedge.get(endpoint, { signal });
					   hedgeTime = Date.now() - hedgeStart;
					   hedgeResult = `✅ Success in ${hedgeTime}ms (${hedgeAttempts} requests)`;
				   } catch (e) {
					   hedgeTime = Date.now() - hedgeStart;
					   hedgeResult = `❌ Failed after ${hedgeTime}ms (${hedgeAttempts} requests): ${e.message}`;
				   }
				   results.push('   ' + hedgeResult);

				   results.push('');
				   results.push('📊 Comparison:');
				   results.push('   • Retry: sequential attempts after error/timeout');
				   results.push('   • Hedging: concurrent requests to reduce latency');
				   results.push('   • Both can improve reliability, but hedging is for tail latency, retry is for error recovery');
				   results.push('   • You can combine both for max resilience!');

				   return results.join('\n');
			   }
		   }
	   ]
};
