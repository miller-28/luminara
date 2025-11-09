import { createLuminara } from '../../dist/index.mjs';

export const debouncer = {
	title: '⏱️ Debouncer',
	examples: [
		{
			id: 'debouncer-search',
			title: 'Search-as-You-Type with Debouncing',
			description: 'Simulates search input with rapid typing. Only the last search executes after 300ms delay.',
			code: `import { createLuminara } from 'luminara';

const api = createLuminara({
  baseURL: 'https://api.example.com',
  debounce: {
    delay: 300,
    key: 'url'
  }
});

// Simulate typing: "r", "re", "rea", "reac", "react"
const searches = ['r', 're', 'rea', 'reac', 'react'];

for (const query of searches) {
  api.get(\`/search?q=\${query}\`);
  await new Promise(resolve => setTimeout(resolve, 50));
}

// Only the last search ("react") executes after 300ms
// Previous searches are automatically cancelled`,
			run: async (updateOutput, signal) => {
				updateOutput('🔍 Simulating search-as-you-type with debouncing...\n');
				
				const api = createLuminara({
					baseURL: 'https://jsonplaceholder.typicode.com',
					debounce: {
						delay: 300,
						key: 'url' // Group by URL
					}
				});
				
				// Simulate rapid typing: "r", "re", "rea", "reac", "react"
				const searches = ['r', 're', 'rea', 'reac', 'react'];
				const results = [];
				
				updateOutput('📝 Typing sequence: ' + searches.join(' → ') + '\n\n');
				
				for (let i = 0; i < searches.length; i++) {
					const query = searches[i];
					updateOutput(`⌨️  Typing: "${query}"\n`);
					
					const promise = api.get(`/posts/1?q=${query}`, { signal })
						.catch(error => ({ error })); // Catch immediately to prevent unhandled rejection
					results.push({ query, promise });
					
					// Simulate typing delay (50ms between keystrokes)
					if (i < searches.length - 1) {
						await new Promise(resolve => setTimeout(resolve, 50));
					}
				}
				
				updateOutput('\n⏳ Waiting for debounce to complete...\n\n');
				
				// Wait for results
				let successCount = 0;
				let cancelledCount = 0;
				
				for (const { query, promise } of results) {
					try {
						const result = await promise;
						if (result && result.error) {
							// Error was caught earlier
							if (result.error.message.includes('cancelled')) {
								cancelledCount++;
								updateOutput(`🚫 Search for "${query}" cancelled (debounced)\n`);
							} else {
								throw result.error;
							}
						} else {
							// Success
							successCount++;
							updateOutput(`✅ Search for "${query}" executed\n`);
						}
					} catch (error) {
						// Shouldn't reach here, but just in case
						if (error.message.includes('cancelled')) {
							cancelledCount++;
							updateOutput(`🚫 Search for "${query}" cancelled (debounced)\n`);
						} else {
							throw error;
						}
					}
				}
				
				updateOutput('\n📊 Results:\n');
				updateOutput(`   ✅ Executed: ${successCount} (only last search)\n`);
				updateOutput(`   🚫 Cancelled: ${cancelledCount} (debounced)\n`);
				updateOutput(`   💡 Saved ${cancelledCount} unnecessary API calls!\n`);
				
				return `Search debouncing: ${cancelledCount} requests saved`;
			}
		},
		
		{
			id: 'debouncer-button-spam',
			title: 'Button Spam Protection',
			description: 'Prevents multiple form submissions from rapid button clicks. Only first click after delay executes.',
			code: `import { createLuminara } from 'luminara';

const api = createLuminara({
  baseURL: 'https://api.example.com',
  debounce: {
    delay: 500,
    key: 'method+url+body'
  }
});

const formData = {
  title: 'Important Form',
  body: 'User data',
  userId: 1
};

// User clicks submit button 5 times rapidly
for (let i = 0; i < 5; i++) {
  api.post('/submit', formData);
  await new Promise(resolve => setTimeout(resolve, 100));
}

// Only the last submission executes
// First 4 clicks are cancelled by debouncing`,
			run: async (updateOutput, signal) => {
				updateOutput('🖱️  Simulating rapid button clicks...\n');
				
				const api = createLuminara({
					baseURL: 'https://jsonplaceholder.typicode.com',
					debounce: {
						delay: 500,
						key: 'method+url+body' // Group by method, URL, and body
					}
				});
				
				const formData = {
					title: 'Important Form Submission',
					body: 'User data',
					userId: 1
				};
				
				// Simulate user clicking submit button 5 times rapidly
				updateOutput('🖱️  User clicking "Submit" button 5 times...\n\n');
				
				const clicks = [];
				for (let i = 1; i <= 5; i++) {
					updateOutput(`🖱️  Click #${i}\n`);
					const promise = api.post('/posts', formData, { signal })
						.catch(error => ({ error })); // Catch immediately to prevent unhandled rejection
					clicks.push({ clickNum: i, promise });
					
					// Rapid clicks (100ms apart)
					if (i < 5) {
						await new Promise(resolve => setTimeout(resolve, 100));
					}
				}
				
				updateOutput('\n⏳ Processing clicks with debounce protection...\n\n');
				
				let successCount = 0;
				let cancelledCount = 0;
				
				for (const { clickNum, promise } of clicks) {
					try {
						const result = await promise;
						if (result && result.error) {
							// Error was caught earlier
							if (result.error.message.includes('cancelled')) {
								cancelledCount++;
								updateOutput(`🚫 Click #${clickNum} cancelled (debounced)\n`);
							} else {
								throw result.error;
							}
						} else {
							// Success
							successCount++;
							updateOutput(`✅ Click #${clickNum} executed (form submitted)\n`);
						}
					} catch (error) {
						// Shouldn't reach here, but just in case
						if (error.message.includes('cancelled')) {
							cancelledCount++;
							updateOutput(`🚫 Click #${clickNum} cancelled (debounced)\n`);
						} else {
							throw error;
						}
					}
				}
				
				updateOutput('\n📊 Results:\n');
				updateOutput(`   ✅ Submitted: ${successCount} time(s)\n`);
				updateOutput(`   🚫 Prevented: ${cancelledCount} duplicate submission(s)\n`);
				updateOutput(`   💡 Protected against ${cancelledCount} accidental double-submissions!\n`);
				
				return `Button spam protection: ${cancelledCount} duplicates prevented`;
			}
		},
		
		{
			id: 'debouncer-method-specific',
			title: 'Method-Specific Debouncing (GET only)',
			description: 'Debounce only GET requests, while POST/PUT/DELETE execute immediately.',
			code: `import { createLuminara } from 'luminara';

const api = createLuminara({
  baseURL: 'https://api.example.com',
  debounce: {
    delay: 300,
    methods: ['GET']  // Only debounce GET requests
  }
});

// These GET requests will be debounced
api.get('/posts/1');
api.get('/posts/1');
api.get('/posts/1');
// Only last GET executes

// These POST requests execute immediately
api.post('/posts', { title: 'Post 1' });
api.post('/posts', { title: 'Post 2' });
api.post('/posts', { title: 'Post 3' });
// All 3 POST requests execute`,
			run: async (updateOutput, signal) => {
				updateOutput('🔧 Configuring method-specific debouncing...\n');
				updateOutput('   ✅ GET: Debounced (300ms delay)\n');
				updateOutput('   ⚡ POST/PUT/DELETE: Immediate execution\n\n');
				
				const api = createLuminara({
					baseURL: 'https://jsonplaceholder.typicode.com',
					debounce: {
						delay: 300,
						methods: ['GET'] // Only debounce GET requests
					}
				});
				
				// Test 1: Rapid GET requests (should be debounced)
				updateOutput('📖 Test 1: Rapid GET requests to /posts/1\n');
				
				const getPromises = [];
				for (let i = 1; i <= 3; i++) {
					updateOutput(`   Request ${i}\n`);
					getPromises.push(
						api.get('/posts/1', { signal })
							.catch(error => ({ error })) // Catch immediately to prevent unhandled rejection
					);
					await new Promise(resolve => setTimeout(resolve, 50));
				}
				
				updateOutput('   ⏳ Waiting for debounce...\n\n');
				
				let getExecuted = 0;
				let getCancelled = 0;
				
				for (const promise of getPromises) {
					try {
						const result = await promise;
						if (result && result.error) {
							// Error was caught earlier
							if (result.error.message.includes('cancelled')) {
								getCancelled++;
							} else {
								throw result.error;
							}
						} else {
							// Success
							getExecuted++;
						}
					} catch (error) {
						// Shouldn't reach here, but just in case
						if (error.message.includes('cancelled')) {
							getCancelled++;
						} else {
							throw error;
						}
					}
				}
				
				updateOutput(`   📊 GET Results: ${getExecuted} executed, ${getCancelled} cancelled\n\n`);
				
				// Test 2: Rapid POST requests (should NOT be debounced)
				updateOutput('📝 Test 2: Rapid POST requests to /posts\n');
				
				const postPromises = [];
				for (let i = 1; i <= 3; i++) {
					updateOutput(`   Request ${i}\n`);
					postPromises.push(
						api.post('/posts', { title: `Post ${i}`, body: 'test', userId: 1 }, { signal })
							.catch(error => ({ error })) // Catch immediately to prevent unhandled rejection
					);
					await new Promise(resolve => setTimeout(resolve, 50));
				}
				
				updateOutput('   ⚡ Executing immediately (no debounce)...\n\n');
				
				let postExecuted = 0;
				let postCancelled = 0;
				
				for (const promise of postPromises) {
					try {
						const result = await promise;
						if (result && result.error) {
							// Error was caught earlier
							if (result.error.message.includes('cancelled')) {
								postCancelled++;
							} else {
								throw result.error;
							}
						} else {
							// Success
							postExecuted++;
						}
					} catch (error) {
						// Shouldn't reach here, but just in case
						if (error.message.includes('cancelled')) {
							postCancelled++;
						} else {
							throw error;
						}
					}
				}
				
				updateOutput(`   📊 POST Results: ${postExecuted} executed, ${postCancelled} cancelled\n\n`);
				
				updateOutput('✅ Summary:\n');
				updateOutput(`   GET (debounced): ${getExecuted} executed, ${getCancelled} saved\n`);
				updateOutput(`   POST (immediate): ${postExecuted} executed, ${postCancelled} saved\n`);
				updateOutput('   💡 Method-specific debouncing works as expected!\n');
				
				return `Method-specific debouncing: GET=${getCancelled} saved, POST=${postCancelled} saved`;
			}
		},
		
		{
			id: 'debouncer-stats',
			title: 'Debouncing with Stats Monitoring',
			description: 'Track debouncing metrics in real-time with stats integration.',
			code: `import { createLuminara } from 'luminara';

const api = createLuminara({
  baseURL: 'https://api.example.com',
  debounce: {
    delay: 300,
    key: 'url'
  },
  stats: true
});

// Make 5 rapid requests
for (let i = 0; i < 5; i++) {
  api.get('/posts/1');
  await new Promise(resolve => setTimeout(resolve, 50));
}

// Check stats after debouncing
const stats = api.stats();
const counters = stats.counters.get();

console.log('Total requests:', counters.total);
console.log('Success:', counters.success);`,
			run: async (updateOutput, signal) => {
				updateOutput('📊 Initializing client with stats tracking...\n\n');
				
				const api = createLuminara({
					baseURL: 'https://jsonplaceholder.typicode.com',
					debounce: {
						delay: 300,
						key: 'url'
					},
					stats: true
				});
				
				// Scenario 1: Multiple debounced requests
				updateOutput('🔄 Scenario 1: Sending 5 rapid requests to same endpoint...\n');
				
				const batch1 = [];
				for (let i = 1; i <= 5; i++) {
					batch1.push(
						api.get('/posts/1', { signal })
							.catch(error => ({ error })) // Catch immediately to prevent unhandled rejection
					);
					await new Promise(resolve => setTimeout(resolve, 50));
				}
				
				updateOutput('⏳ Waiting for debounce...\n');
				
				for (const promise of batch1) {
					try {
						const result = await promise;
						if (result && result.error && !result.error.message.includes('cancelled')) {
							throw result.error;
						}
					} catch (error) {
						if (!error.message.includes('cancelled')) {
							throw error;
						}
					}
				}
				
				// Check stats after first batch
				const stats = api.stats();
				const stats1 = stats.counters.get();
				
				updateOutput('\n📈 Stats after batch 1:\n');
				updateOutput(`   Total requests: ${stats1.total}\n`);
				updateOutput(`   Success: ${stats1.success}\n\n`);
				
				// Scenario 2: Mix of different endpoints (no debouncing)
				updateOutput('🔄 Scenario 2: Sending requests to different endpoints...\n');
				
				const batch2 = [
					api.get('/posts/1', { signal }).catch(error => ({ error })),
					api.get('/posts/2', { signal }).catch(error => ({ error })),
					api.get('/posts/3', { signal }).catch(error => ({ error }))
				];
				
				await Promise.all(batch2);
				
				// Check stats after second batch
				const stats2 = stats.counters.get();
				
				updateOutput('\n📈 Stats after batch 2:\n');
				updateOutput(`   Total requests: ${stats2.total}\n`);
				updateOutput(`   Success: ${stats2.success}\n\n`);
				
				// Final summary
				updateOutput('✅ Final Summary:\n');
				updateOutput(`   📊 Total requests made: ${stats2.total}\n`);
				updateOutput(`   ✅ Successful requests: ${stats2.success}\n`);
				updateOutput('   💡 Stats tracking with debouncing works!\n');
				
				return `Stats: ${stats2.total} total requests, ${stats2.success} succeeded`;
			}
		},
		
		{
			id: 'debouncer-with-retry',
			title: 'Debouncer + Retry (Long Debounce)',
			description: 'Debouncing works seamlessly with retry - only the final debounced request retries on failure.',
			code: `import { createLuminara } from 'luminara';

const api = createLuminara({
  baseURL: 'https://api.example.com',
  debounce: {
    delay: 1000,
    key: 'url'
  },
  retry: 3,
  retryDelay: 500
});

// Make 5 rapid requests
for (let i = 0; i < 5; i++) {
  api.get('/posts/1');
  await new Promise(resolve => setTimeout(resolve, 150));
}

// Debouncing happens BEFORE retry logic
// Only the last request executes and retries on failure
// First 4 requests are cancelled (no retries)`,
			run: async (updateOutput, signal) => {
				updateOutput('🔄 Testing debouncer with retry logic...\n\n');
				
				const api = createLuminara({
					baseURL: 'https://jsonplaceholder.typicode.com',
					debounce: {
						delay: 1000, // Long debounce delay
						key: 'url'
					},
					retry: 3,
					retryDelay: 500
				});
				
				updateOutput('📝 Configuration:\n');
				updateOutput('   ⏱️  Debounce delay: 1000ms\n');
				updateOutput('   🔄 Retry attempts: 3\n');
				updateOutput('   ⏳ Retry delay: 500ms\n\n');
				
				// Track retry attempts with interceptor
				let retryAttempts = 0;
				api.use({
					onRequest: (context) => {
						if (context.attempt > 1) {
							retryAttempts++;
							updateOutput(`   🔄 Retry attempt ${context.attempt - 1}\n`);
						}
						return context;
					}
				});
				
				// Scenario 1: Multiple rapid requests (debouncing)
				updateOutput('🎯 Scenario 1: Sending 5 rapid requests...\n');
				
				const requests = [];
				for (let i = 1; i <= 5; i++) {
					updateOutput(`   📤 Request #${i} queued\n`);
					requests.push(
						api.get('/posts/1', { signal })
							.catch(error => ({ error }))
					);
					await new Promise(resolve => setTimeout(resolve, 150)); // 150ms between requests
				}
				
				updateOutput('\n⏳ Waiting for debounce (1000ms)...\n');
				
				let executed = 0;
				let cancelled = 0;
				
				for (let i = 0; i < requests.length; i++) {
					const result = await requests[i];
					if (result && result.error) {
						if (result.error.message.includes('cancelled')) {
							cancelled++;
						} else {
							throw result.error;
						}
					} else {
						executed++;
						updateOutput(`   ✅ Request #${i + 1} executed successfully\n`);
					}
				}
				
				updateOutput('\n📊 Debouncing Results:\n');
				updateOutput(`   ✅ Executed: ${executed} (only last request)\n`);
				updateOutput(`   🚫 Cancelled: ${cancelled} (debounced)\n`);
				updateOutput(`   🔄 Retry attempts: ${retryAttempts} (none needed - request succeeded)\n\n`);
				
				// Scenario 2: Test retry on debounced request
				updateOutput('🎯 Scenario 2: Debounced request to failing endpoint...\n');
				
				retryAttempts = 0;
				const failingRequests = [];
				
				for (let i = 1; i <= 3; i++) {
					updateOutput(`   📤 Request #${i} to /invalid-endpoint\n`);
					failingRequests.push(
						api.get('/invalid-endpoint-404', { signal })
							.catch(error => ({ error }))
					);
					await new Promise(resolve => setTimeout(resolve, 150));
				}
				
				updateOutput('\n⏳ Waiting for debounce and retries...\n');
				
				let failedAfterRetry = 0;
				let cancelledFailing = 0;
				
				for (const promise of failingRequests) {
					const result = await promise;
					if (result && result.error) {
						if (result.error.message.includes('cancelled')) {
							cancelledFailing++;
						} else {
							failedAfterRetry++;
						}
					}
				}
				
				updateOutput('\n📊 Retry Results:\n');
				updateOutput(`   🚫 Cancelled by debounce: ${cancelledFailing}\n`);
				updateOutput(`   ❌ Failed after retries: ${failedAfterRetry}\n`);
				updateOutput(`   🔄 Total retry attempts: ${retryAttempts}\n`);
				updateOutput('   💡 Only the final debounced request triggered retries!\n\n');
				
				updateOutput('✅ Summary:\n');
				updateOutput('   Debouncing happens BEFORE retry logic\n');
				updateOutput('   Only the final debounced request retries on failure\n');
				updateOutput('   Cancelled requests never trigger retries\n');
				
				return `Debouncer + Retry: ${cancelled + cancelledFailing} cancelled, ${retryAttempts} retries executed`;
			}
		},
		
		{
			id: 'debouncer-with-timeout',
			title: 'Debouncer + Timeout',
			description: 'Timeout applies only to the final debounced request, not to the debounce delay.',
			code: `import { createLuminara } from 'luminara';

const api = createLuminara({
  baseURL: 'https://api.example.com',
  debounce: {
    delay: 800,
    key: 'url'
  },
  timeout: 5000  // Timeout for actual request
});

// Make 4 rapid requests
for (let i = 0; i < 4; i++) {
  api.get('/posts/1');
  await new Promise(resolve => setTimeout(resolve, 100));
}

// Timeout countdown starts AFTER debounce delay
// Debounce delay (800ms) does NOT count toward timeout`,
			run: async (updateOutput, signal) => {
				updateOutput('⏱️  Testing debouncer with timeout...\n\n');
				
				const api = createLuminara({
					baseURL: 'https://jsonplaceholder.typicode.com',
					debounce: {
						delay: 800,
						key: 'url'
					},
					timeout: 5000 // 5 second timeout for actual request
				});
				
				updateOutput('📝 Configuration:\n');
				updateOutput('   ⏱️  Debounce delay: 800ms\n');
				updateOutput('   ⏰ Request timeout: 5000ms\n\n');
				
				updateOutput('🎯 Test: Multiple rapid requests with timeout\n');
				updateOutput('   Expected: Debounce delay does NOT count toward timeout\n\n');
				
				const requests = [];
				const startTime = Date.now();
				
				for (let i = 1; i <= 4; i++) {
					const timestamp = Date.now() - startTime;
					updateOutput(`   📤 [${timestamp}ms] Request #${i} queued\n`);
					requests.push(
						api.get('/posts/1', { signal })
							.then(response => ({ response, requestNum: i }))
							.catch(error => ({ error, requestNum: i }))
					);
					await new Promise(resolve => setTimeout(resolve, 100));
				}
				
				updateOutput('\n⏳ Waiting for debounce and execution...\n\n');
				
				let executed = 0;
				let cancelled = 0;
				let timedOut = 0;
				
				for (const promise of requests) {
					const result = await promise;
					const elapsed = Date.now() - startTime;
					
					if (result.error) {
						if (result.error.message.includes('cancelled')) {
							cancelled++;
							updateOutput(`   🚫 [${elapsed}ms] Request #${result.requestNum} cancelled (debounced)\n`);
						} else if (result.error.message.includes('timeout')) {
							timedOut++;
							updateOutput(`   ⏰ [${elapsed}ms] Request #${result.requestNum} timed out\n`);
						} else {
							throw result.error;
						}
					} else {
						executed++;
						updateOutput(`   ✅ [${elapsed}ms] Request #${result.requestNum} completed successfully\n`);
					}
				}
				
				const totalTime = Date.now() - startTime;
				
				updateOutput(`\n📊 Results (Total time: ${totalTime}ms):\n`);
				updateOutput(`   ✅ Executed: ${executed}\n`);
				updateOutput(`   🚫 Cancelled: ${cancelled}\n`);
				updateOutput(`   ⏰ Timed out: ${timedOut}\n`);
				updateOutput('   💡 Timeout started AFTER debounce delay!\n');
				
				return `Debouncer + Timeout: ${executed} executed, ${cancelled} cancelled, ${timedOut} timed out`;
			}
		},
		
		{
			id: 'debouncer-with-interceptors',
			title: 'Debouncer + Interceptors',
			description: 'Interceptors work with debouncing - onRequest runs after debounce, before actual request.',
			code: `import { createLuminara } from 'luminara';

const api = createLuminara({
  baseURL: 'https://api.example.com',
  debounce: {
    delay: 500,
    key: 'url'
  }
});

// Add interceptors
api.use({
  onRequest: (context) => {
    console.log('onRequest:', context.req.method, context.req.url);
    context.req.headers['X-Debounced'] = 'true';
    return context;
  },
  onSuccess: (context) => {
    console.log('onSuccess:', context.res.status);
    return context;
  }
});

// Make 4 rapid requests
for (let i = 0; i < 4; i++) {
  api.get('/posts/1');
  await new Promise(resolve => setTimeout(resolve, 80));
}

// Interceptors run AFTER debouncing
// Only the final request triggers onRequest/onSuccess`,
			run: async (updateOutput, signal) => {
				updateOutput('🔌 Testing debouncer with interceptors...\n\n');
				
				const requestLog = [];
				const responseLog = [];
				const errorLog = [];
				
				const api = createLuminara({
					baseURL: 'https://jsonplaceholder.typicode.com',
					debounce: {
						delay: 500,
						key: 'url'
					}
				});
				
				// Add interceptors
				api.use({
					onRequest: (context) => {
						const logEntry = `[${Date.now()}] onRequest: ${context.req.method} ${context.req.url}`;
						requestLog.push(logEntry);
						updateOutput(`   🔵 ${logEntry}\n`);
						
						// Add custom header
						context.req.headers = {
							...context.req.headers,
							'X-Debounced': 'true'
						};
						
						return context;
					},
					onSuccess: (context) => {
						const logEntry = `[${Date.now()}] onSuccess: ${context.res.status}`;
						responseLog.push(logEntry);
						updateOutput(`   🟢 ${logEntry}\n`);
						return context;
					},
					onError: (context) => {
						const logEntry = `[${Date.now()}] onError: ${context.error.message}`;
						errorLog.push(logEntry);
						updateOutput(`   🔴 ${logEntry}\n`);
						return context;
					}
				});
				
				updateOutput('📝 Configuration:\n');
				updateOutput('   ⏱️  Debounce delay: 500ms\n');
				updateOutput('   🔌 Interceptors: onRequest, onSuccess, onError\n\n');
				
				updateOutput('🎯 Sending 4 rapid requests...\n\n');
				
				const requests = [];
				for (let i = 1; i <= 4; i++) {
					updateOutput(`📤 Queueing request #${i}\n`);
					requests.push(
						api.get('/posts/1', { signal })
							.catch(error => ({ error }))
					);
					await new Promise(resolve => setTimeout(resolve, 80));
				}
				
				updateOutput('\n⏳ Processing with debounce and interceptors...\n\n');
				
				let executed = 0;
				let cancelled = 0;
				
				for (const promise of requests) {
					const result = await promise;
					if (result && result.error) {
						if (result.error.message.includes('cancelled')) {
							cancelled++;
						} else {
							throw result.error;
						}
					} else {
						executed++;
					}
				}
				
				updateOutput('\n📊 Results:\n');
				updateOutput(`   ✅ Executed: ${executed}\n`);
				updateOutput(`   🚫 Cancelled: ${cancelled}\n`);
				updateOutput(`   🔵 onRequest called: ${requestLog.length} time(s)\n`);
				updateOutput(`   🟢 onSuccess called: ${responseLog.length} time(s)\n`);
				updateOutput(`   🔴 onError called: ${errorLog.length} time(s)\n\n`);
				
				updateOutput('💡 Key Insights:\n');
				updateOutput('   Interceptors run AFTER debouncing\n');
				updateOutput('   Only the final request triggers interceptors\n');
				updateOutput('   Cancelled requests don\'t trigger onRequest/onSuccess\n');
				
				return `Debouncer + Interceptors: ${requestLog.length} onRequest, ${responseLog.length} onSuccess`;
			}
		},
		
		{
			id: 'debouncer-with-abort',
			title: 'Debouncer + Manual Abort',
			description: 'Manual abort with AbortController works alongside automatic debouncing.',
			code: `import { createLuminara } from 'luminara';

const api = createLuminara({
  baseURL: 'https://api.example.com',
  debounce: {
    delay: 600,
    key: 'url'
  }
});

// Create abort controller
const controller = new AbortController();

// Queue request with abort signal
const request = api.get('/posts/1', { 
  signal: controller.signal 
});

// Abort during debounce delay (before execution)
setTimeout(() => controller.abort(), 300);

// Manual abort works alongside automatic debouncing
// Both cancellation mechanisms are independent`,
			run: async (updateOutput, signal) => {
				updateOutput('🛑 Testing debouncer with manual abort...\n\n');
				
				const api = createLuminara({
					baseURL: 'https://jsonplaceholder.typicode.com',
					debounce: {
						delay: 600,
						key: 'url'
					}
				});
				
				updateOutput('📝 Configuration:\n');
				updateOutput('   ⏱️  Debounce delay: 600ms\n');
				updateOutput('   🛑 Manual AbortController\n\n');
				
				// Scenario 1: Abort during debounce delay
				updateOutput('🎯 Scenario 1: Abort DURING debounce delay\n');
				
				const controller1 = new AbortController();
				
				const request1 = api.get('/posts/1', { signal: controller1.signal })
					.catch(error => ({ error }));
				
				updateOutput('   📤 Request queued\n');
				updateOutput('   ⏳ Waiting 300ms...\n');
				await new Promise(resolve => setTimeout(resolve, 300));
				
				updateOutput('   🛑 Aborting during debounce delay\n');
				controller1.abort();
				
				const result1 = await request1;
				if (result1.error) {
					if (result1.error.message.includes('abort')) {
						updateOutput('   ✅ Request aborted successfully during debounce\n\n');
					} else if (result1.error.message.includes('cancelled')) {
						updateOutput('   ✅ Request cancelled by debouncing\n\n');
					}
				}
				
				// Scenario 2: Multiple requests with manual abort
				updateOutput('🎯 Scenario 2: Abort one request, let others debounce\n');
				
				const controller2 = new AbortController();
				const controller3 = new AbortController();
				
				const req1 = api.get('/posts/1', { signal: controller2.signal })
					.catch(error => ({ error, id: 1 }));
				
				await new Promise(resolve => setTimeout(resolve, 100));
				
				const req2 = api.get('/posts/1', { signal: controller3.signal })
					.catch(error => ({ error, id: 2 }));
				
				await new Promise(resolve => setTimeout(resolve, 100));
				
				const req3 = api.get('/posts/1', { signal })
					.catch(error => ({ error, id: 3 }));
				
				updateOutput('   📤 3 requests queued\n');
				updateOutput('   🛑 Aborting request #2 manually\n');
				
				controller3.abort();
				
				updateOutput('   ⏳ Waiting for debounce...\n\n');
				
				const results = await Promise.all([req1, req2, req3]);
				
				let aborted = 0;
				let debounced = 0;
				let executed = 0;
				
				results.forEach((result, index) => {
					if (result.error) {
						if (result.error.message.includes('abort')) {
							aborted++;
							updateOutput(`   🛑 Request #${index + 1} aborted manually\n`);
						} else if (result.error.message.includes('cancelled')) {
							debounced++;
							updateOutput(`   🚫 Request #${index + 1} cancelled by debouncing\n`);
						}
					} else {
						executed++;
						updateOutput(`   ✅ Request #${index + 1} executed successfully\n`);
					}
				});
				
				updateOutput('\n📊 Results:\n');
				updateOutput(`   ✅ Executed: ${executed}\n`);
				updateOutput(`   🚫 Debounced: ${debounced}\n`);
				updateOutput(`   🛑 Manually aborted: ${aborted}\n\n`);
				
				updateOutput('💡 Key Insights:\n');
				updateOutput('   Manual abort works during debounce delay\n');
				updateOutput('   Debouncing and manual abort are independent\n');
				updateOutput('   Both cancellation mechanisms work together\n');
				
				return `Debouncer + Abort: ${executed} executed, ${debounced} debounced, ${aborted} aborted`;
			}
		}
	]
};
