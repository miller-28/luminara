/**
 * Integrated Scenario Benchmarks
 * Tests: Real-world patterns, concurrent requests, all features combined
 */

export async function integratedBenchmarks(bench, mockServer, config) {
	const { createLuminara } = await import('../../../dist/index.mjs');
	
	// ========== Simple Scenarios ==========
	
	// Benchmark: Bare minimum request
	const bareMinimum = createLuminara({
		baseURL: `http://localhost:${mockServer.port}`
	});
	
	bench.add('Scenario - Bare minimum GET', async () => {
		await bareMinimum.get('/json-small');
	});
	
	// Benchmark: With retry enabled
	const withRetry = createLuminara({
		baseURL: `http://localhost:${mockServer.port}`,
		retry: 3,
		retryDelay: 100
	});
	
	bench.add('Scenario - GET with retry (success first attempt)', async () => {
		await withRetry.get('/json-small');
	});
	
	// Benchmark: With stats enabled
	const withStats = createLuminara({
		baseURL: `http://localhost:${mockServer.port}`
	});
	withStats.enableStats();
	
	bench.add('Scenario - GET with stats collection', async () => {
		await withStats.get('/json-small');
	});
	
	// Benchmark: With single plugin
	const withPlugin = createLuminara({
		baseURL: `http://localhost:${mockServer.port}`
	});
	withPlugin.use({
		name: 'auth-plugin',
		onRequest(context) {
			context.req.headers = context.req.headers || {};
			context.req.headers['Authorization'] = 'Bearer token123';
		}
	});
	
	bench.add('Scenario - GET with 1 plugin', async () => {
		await withPlugin.get('/json-small');
	});
	
	// Benchmark: With 3 plugins
	const with3Plugins = createLuminara({
		baseURL: `http://localhost:${mockServer.port}`
	});
	with3Plugins
		.use({
			name: 'auth',
			onRequest(ctx) {
				ctx.req.headers = ctx.req.headers || {}; ctx.req.headers['Authorization'] = 'Bearer token'; 
			}
		})
		.use({
			name: 'logging',
			onRequest(ctx) {
				ctx.req.headers['X-Request-ID'] = 'req-123'; 
			}
		})
		.use({
			name: 'transform',
			onResponse(ctx) {
				if (ctx.res) {
					ctx.res.transformed = true;
				} 
			}
		});
	
	bench.add('Scenario - GET with 3 plugins', async () => {
		await with3Plugins.get('/json-small');
	});
	
	// ========== All Features Combined ==========
	
	// Benchmark: Everything enabled
	const everything = createLuminara({
		baseURL: `http://localhost:${mockServer.port}`,
		retry: 3,
		retryDelay: 100,
		timeout: 5000
	});
	everything.enableStats();
	everything.use({
		name: 'comprehensive',
		onRequest(ctx) {
			ctx.req.headers = ctx.req.headers || {};
			ctx.req.headers['X-App'] = 'luminara-benchmark';
		}
	});
	
	bench.add('Scenario - ALL features enabled', async () => {
		await everything.get('/json-small');
	});
	
	// ========== Concurrent Requests ==========
	
	// Benchmark: 10 concurrent requests
	const concurrent10 = createLuminara({
		baseURL: `http://localhost:${mockServer.port}`
	});
	
	bench.add('Scenario - 10 concurrent requests', async () => {
		await Promise.all(
			Array.from({ length: 10 }, () => concurrent10.get('/json-small'))
		);
	});
	
	// Benchmark: 50 concurrent requests
	const concurrent50 = createLuminara({
		baseURL: `http://localhost:${mockServer.port}`
	});
	
	bench.add('Scenario - 50 concurrent requests', async () => {
		await Promise.all(
			Array.from({ length: 50 }, () => concurrent50.get('/json-small'))
		);
	});
	
	// ========== Sequential Requests ==========
	
	// Benchmark: 10 sequential requests
	const sequential10 = createLuminara({
		baseURL: `http://localhost:${mockServer.port}`
	});
	
	bench.add('Scenario - 10 sequential requests', async () => {
		for (let i = 0; i < 10; i++) {
			await sequential10.get('/json-small');
		}
	});
	
	// ========== Different HTTP Methods ==========
	
	// Benchmark: Mixed HTTP methods
	const mixedMethods = createLuminara({
		baseURL: `http://localhost:${mockServer.port}`
	});
	
	bench.add('Scenario - Mixed HTTP methods (GET/POST/PUT)', async () => {
		await mixedMethods.get('/json-small');
		await mixedMethods.postJson('/json-small', { data: 'test' });
		await mixedMethods.put('/json-small', { data: 'updated' });
	});
	
	// ========== Memory Efficiency ==========
	
	// Benchmark: Large payload handling
	const largePayload = createLuminara({
		baseURL: `http://localhost:${mockServer.port}`
	});
	
	bench.add('Scenario - Large payload (100KB)', async () => {
		await largePayload.getJson('/json-large');
	});
	
	// Benchmark: Very large payload
	const veryLargePayload = createLuminara({
		baseURL: `http://localhost:${mockServer.port}`
	});
	
	bench.add('Scenario - Very large payload (1MB blob)', async () => {
		await veryLargePayload.getBlob('/blob');
	});
}
