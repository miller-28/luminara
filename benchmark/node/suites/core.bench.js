/**
 * Core Layer Benchmarks
 * Tests: Client initialization, plugin system, configuration
 */

export async function coreBenchmarks(bench, mockServer, config) {
	// Import Luminara dynamically to measure cold start
	const { createLuminara } = await import('../../../dist/index.mjs');
	
	// Benchmark: Client initialization - cold start
	bench.add('createLuminara() - cold start', () => {
		const api = createLuminara({
			baseURL: `http://localhost:${mockServer.port}`
		});
	});
	
	// Warm up for subsequent benchmarks
	const api = createLuminara({
		baseURL: `http://localhost:${mockServer.port}`
	});
	
	// Benchmark: Client initialization - warm start
	bench.add('createLuminara() - warm start', () => {
		const api = createLuminara({
			baseURL: `http://localhost:${mockServer.port}`
		});
	});
	
	// Benchmark: Plugin registration - single plugin
	bench.add('api.use() - register 1 plugin', () => {
		api.use({
			name: 'test-plugin',
			onRequest(context) {
				context.req.headers['X-Test'] = 'true';
			}
		});
	});
	
	// Benchmark: Plugin registration - 10 plugins
	bench.add('api.use() - register 10 plugins', () => {
		for (let i = 0; i < 10; i++) {
			api.use({
				name: `test-plugin-${i}`,
				onRequest(context) {
					context.req.headers[`X-Test-${i}`] = 'true';
				}
			});
		}
	});
	
	// Benchmark: Configuration update - simple
	bench.add('api.updateConfig() - simple', () => {
		api.updateConfig({
			timeout: 5000
		});
	});
	
	// Benchmark: Configuration update - complex
	bench.add('api.updateConfig() - complex', () => {
		api.updateConfig({
			timeout: 5000,
			retry: 3,
			retryDelay: 1000,
			retryStatusCodes: [408, 429, 500, 502, 503, 504],
			headers: {
				'X-Custom': 'value',
				'X-Another': 'test'
			}
		});
	});
}
