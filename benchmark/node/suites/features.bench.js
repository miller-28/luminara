/**
 * Feature Benchmarks
 * Tests: Retry, Backoff strategies, Rate limiting, Stats, Deduplication, Debouncing
 */

export async function featureBenchmarks(bench, mockServer, config) {
	const { createLuminara, backoffStrategies } = await import('../../../dist/index.mjs');
	
	// ========== Retry & Backoff Benchmarks ==========
	
	// Benchmark: Linear backoff (3 retries)
	const linearApi = createLuminara({
		baseURL: `http://localhost:${mockServer.port}`,
		retry: 3,
		retryDelay: 10,
		backoffType: 'linear'
	});
	
	bench.add('Retry - Linear backoff (success first try)', async () => {
		try {
			await linearApi.get('/json-small');
		} catch (e) {}
	});
	
	// Benchmark: Exponential backoff
	const exponentialApi = createLuminara({
		baseURL: `http://localhost:${mockServer.port}`,
		retry: 3,
		retryDelay: 10,
		backoffType: 'exponential'
	});
	
	bench.add('Retry - Exponential backoff (success first try)', async () => {
		try {
			await exponentialApi.get('/json-small');
		} catch (e) {}
	});
	
	// Benchmark: Fibonacci backoff
	const fibonacciApi = createLuminara({
		baseURL: `http://localhost:${mockServer.port}`,
		retry: 3,
		retryDelay: 10,
		backoffType: 'fibonacci'
	});
	
	bench.add('Retry - Fibonacci backoff (success first try)', async () => {
		try {
			await fibonacciApi.get('/json-small');
		} catch (e) {}
	});
	
	// Benchmark: Custom backoff handler
	const customBackoffHandler = (context) => {
		return context.retryDelay * context.attempt;
	};
	
	const customApi = createLuminara({
		baseURL: `http://localhost:${mockServer.port}`,
		retry: 3,
		retryDelay: customBackoffHandler
	});
	
	bench.add('Retry - Custom backoff handler (success first try)', async () => {
		try {
			await customApi.get('/json-small');
		} catch (e) {}
	});
	
	// ========== Rate Limiting Benchmarks ==========
	
	// Benchmark: Rate limiting - tokens available
	const rateLimitedApi = createLuminara({
		baseURL: `http://localhost:${mockServer.port}`,
		rateLimit: {
			limit: 100,
			windowMs: 1000
		}
	});
	
	bench.add('Rate Limit - tokens available', async () => {
		await rateLimitedApi.get('/json-small');
	});
	
	// Benchmark: Rate limiting with endpoint scoping
	const scopedRateLimitApi = createLuminara({
		baseURL: `http://localhost:${mockServer.port}`,
		rateLimit: {
			limit: 100,
			windowMs: 1000,
			scope: 'endpoint'
		}
	});
	
	bench.add('Rate Limit - endpoint scoped', async () => {
		await scopedRateLimitApi.get('/json-small');
	});
	
	// ========== Stats System Benchmarks ==========
	
	// Benchmark: Stats collection enabled
	const statsApi = createLuminara({
		baseURL: `http://localhost:${mockServer.port}`
	});
	statsApi.enableStats();
	
	bench.add('Stats - collection enabled', async () => {
		await statsApi.get('/json-small');
	});
	
	// Benchmark: Stats query - simple
	bench.add('Stats - query simple', () => {
		statsApi.stats().query({
			select: ['count'],
			where: { status: 200 }
		});
	});
	
	// Benchmark: Stats query - complex with groupBy
	bench.add('Stats - query complex with groupBy', () => {
		statsApi.stats().query({
			select: ['count', 'avgDuration'],
			groupBy: 'endpoint',
			where: { status: 200 }
		});
	});
	
	// Benchmark: Stats reset
	bench.add('Stats - reset all', () => {
		statsApi.stats().reset();
	});
	
	// ========== Request Deduplication Benchmarks ==========
	
	// Benchmark: Deduplication - cache miss
	const dedupeApi = createLuminara({
		baseURL: `http://localhost:${mockServer.port}`,
		deduplicate: {
			keyStrategy: 'url+method',
			cacheTTL: 1000
		}
	});
	
	bench.add('Deduplication - cache miss (first request)', async () => {
		await dedupeApi.get(`/json-small?t=${Date.now()}`);
	});
	
	// Benchmark: Deduplication key generation
	const dedupeContext = {
		req: {
			url: 'http://localhost:9999/test',
			method: 'GET',
			headers: { 'X-Test': 'value' },
			body: { data: 'test' }
		}
	};
	
	bench.add('Deduplication - key generation (url)', () => {
		const key = `${dedupeContext.req.url}`;
	});
	
	bench.add('Deduplication - key generation (url+method)', () => {
		const key = `${dedupeContext.req.method}:${dedupeContext.req.url}`;
	});
	
	bench.add('Deduplication - key generation (url+method+body)', () => {
		const key = `${dedupeContext.req.method}:${dedupeContext.req.url}:${JSON.stringify(dedupeContext.req.body)}`;
	});
	
	// ========== Request Debouncing Benchmarks ==========
	
	// Benchmark: Debouncing - first request
	const debounceApi = createLuminara({
		baseURL: `http://localhost:${mockServer.port}`,
		debounce: {
			delay: 100,
			methods: ['GET']
		}
	});
	
	bench.add('Debouncing - first request', async () => {
		await debounceApi.get(`/json-small?t=${Date.now()}`);
	});
	
	// ========== Request Hedging Benchmarks ==========
	
	// Benchmark: Hedging - Race policy (success first try)
	const hedgingRaceApi = createLuminara({
		baseURL: `http://localhost:${mockServer.port}`,
		hedging: {
			policy: 'race',
			hedgeDelay: 100,
			maxHedges: 2
		}
	});
	
	bench.add('Hedging - Race policy (success first try)', async () => {
		try {
			await hedgingRaceApi.get('/json-small');
		} catch (e) {}
	});
	
	// Benchmark: Hedging - Cancel-and-retry policy
	const hedgingCancelApi = createLuminara({
		baseURL: `http://localhost:${mockServer.port}`,
		hedging: {
			policy: 'cancel-and-retry',
			hedgeDelay: 100,
			maxHedges: 2
		}
	});
	
	bench.add('Hedging - Cancel-and-retry policy (success first try)', async () => {
		try {
			await hedgingCancelApi.get('/json-small');
		} catch (e) {}
	});
	
	// Benchmark: Hedging with exponential backoff
	const hedgingBackoffApi = createLuminara({
		baseURL: `http://localhost:${mockServer.port}`,
		hedging: {
			policy: 'race',
			hedgeDelay: 50,
			maxHedges: 3,
			exponentialBackoff: true,
			backoffMultiplier: 2
		}
	});
	
	bench.add('Hedging - Exponential backoff with jitter', async () => {
		try {
			await hedgingBackoffApi.get('/json-small');
		} catch (e) {}
	});
	
	// Benchmark: Hedging overhead (hedging enabled but not triggered)
	const hedgingNoTriggerApi = createLuminara({
		baseURL: `http://localhost:${mockServer.port}`,
		hedging: {
			policy: 'race',
			hedgeDelay: 10000, // Very long - won't trigger
			maxHedges: 2
		}
	});
	
	bench.add('Hedging - Overhead when not triggered', async () => {
		try {
			await hedgingNoTriggerApi.get('/json-small');
		} catch (e) {}
	});
	
	// Benchmark: Debounce key generation
	bench.add('Debouncing - key generation (url)', () => {
		const key = `${dedupeContext.req.url}`;
	});
	
	bench.add('Debouncing - key generation (method+url)', () => {
		const key = `${dedupeContext.req.method}:${dedupeContext.req.url}`;
	});
	
	// ========== Combined Features Benchmarks ==========
	
	// Benchmark: All features disabled (baseline)
	const baselineApi = createLuminara({
		baseURL: `http://localhost:${mockServer.port}`
	});
	
	bench.add('All features OFF - baseline', async () => {
		await baselineApi.get('/json-small');
	});
	
	// Benchmark: All features enabled (including hedging)
	const allFeaturesApi = createLuminara({
		baseURL: `http://localhost:${mockServer.port}`,
		retry: 3,
		retryDelay: 10,
		timeout: 5000,
		rateLimit: {
			limit: 100,
			windowMs: 1000
		},
		hedging: {
			policy: 'race',
			hedgeDelay: 5000, // Won't trigger in normal requests
			maxHedges: 1
		}
	});
	allFeaturesApi.enableStats();
	
	bench.add('All features ON - full overhead', async () => {
		await allFeaturesApi.get('/json-small');
	});
}
