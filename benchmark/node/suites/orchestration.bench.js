/**
 * Orchestration Layer Benchmarks
 * Tests: PluginPipeline, RetryOrchestrator, ContextBuilder, SignalManager
 */

export async function orchestrationBenchmarks(bench, mockServer, config) {
	const { 
		createLuminara,
		PluginPipeline,
		ContextBuilder,
		SignalManager
	} = await import('../../../dist/index.mjs');
	
	// Create API instance
	const api = createLuminara({
		baseURL: `http://localhost:${mockServer.port}`
	});
	
	// ========== PluginPipeline Benchmarks ==========
	
	// Create test plugins
	const createTestPlugin = (name) => ({
		name,
		onRequest(context) {
			context.req.headers = context.req.headers || {};
			context.req.headers[`X-Plugin-${name}`] = 'true';
		},
		onResponse(context) {
			// Simulate response transformation
			if (context.res) {
				context.res.transformed = true;
			}
		}
	});
	
	// Benchmark: Empty pipeline
	const emptyPipeline = new PluginPipeline([]);
	const emptyContext = {
		req: { url: '/test', method: 'GET', headers: {} },
		res: { status: 200, data: {} }
	};
	
	bench.add('PluginPipeline - empty (onRequest)', async () => {
		await emptyPipeline.executeOnRequest(emptyContext);
	});
	
	bench.add('PluginPipeline - empty (onResponse)', async () => {
		await emptyPipeline.executeOnResponse(emptyContext);
	});
	
	// Benchmark: Single plugin
	const singlePlugin = new PluginPipeline([createTestPlugin('single')]);
	const singleContext = {
		req: { url: '/test', method: 'GET', headers: {} },
		res: { status: 200, data: {} }
	};
	
	bench.add('PluginPipeline - 1 plugin (onRequest)', async () => {
		await singlePlugin.executeOnRequest(singleContext);
	});
	
	bench.add('PluginPipeline - 1 plugin (onResponse)', async () => {
		await singlePlugin.executeOnResponse(singleContext);
	});
	
	// Benchmark: 5 plugins
	const fivePlugins = new PluginPipeline([
		createTestPlugin('one'),
		createTestPlugin('two'),
		createTestPlugin('three'),
		createTestPlugin('four'),
		createTestPlugin('five')
	]);
	const fiveContext = {
		req: { url: '/test', method: 'GET', headers: {} },
		res: { status: 200, data: {} }
	};
	
	bench.add('PluginPipeline - 5 plugins (onRequest L→R)', async () => {
		await fivePlugins.executeOnRequest(fiveContext);
	});
	
	bench.add('PluginPipeline - 5 plugins (onResponse R→L)', async () => {
		await fivePlugins.executeOnResponse(fiveContext);
	});
	
	// Benchmark: 10 plugins
	const tenPlugins = new PluginPipeline(
		Array.from({ length: 10 }, (_, i) => createTestPlugin(`plugin-${i}`))
	);
	const tenContext = {
		req: { url: '/test', method: 'GET', headers: {} },
		res: { status: 200, data: {} }
	};
	
	bench.add('PluginPipeline - 10 plugins (onRequest)', async () => {
		await tenPlugins.executeOnRequest(tenContext);
	});
	
	bench.add('PluginPipeline - 10 plugins (onResponse)', async () => {
		await tenPlugins.executeOnResponse(tenContext);
	});
	
	// ========== ContextBuilder Benchmarks ==========
	
	// Benchmark: Simple context
	bench.add('ContextBuilder - simple request', () => {
		const driver = { constructor: { name: 'TestDriver' } };
		ContextBuilder.build({ url: '/test', method: 'GET' }, driver);
	});
	
	// Benchmark: Complex context
	bench.add('ContextBuilder - complex request', () => {
		const driver = { constructor: { name: 'TestDriver' } };
		ContextBuilder.build({
			url: '/test',
			method: 'POST',
			headers: { 'X-Custom': 'value' },
			body: { data: 'test' },
			retry: 3,
			timeout: 5000,
			tags: ['test', 'benchmark']
		}, driver);
	});
	
	// ========== SignalManager Benchmarks ==========
	
	// Benchmark: Create signal
	bench.add('SignalManager - create AbortController', () => {
		new AbortController();
	});
	
	// Benchmark: Merge signals
	bench.add('SignalManager - merge user signal', () => {
		const context = {
			controller: new AbortController(),
			req: {}
		};
		const userSignal = new AbortController().signal;
		const statsEmitter = { emit: () => {} };
		SignalManager.mergeUserSignal(context, userSignal, statsEmitter);
	});
	
	// ========== Internal Timing Benchmarks ==========
	
	// Benchmark: Request with internal timings
	bench.add('Full request with __benchmark flag', async () => {
		await api.get('/json-small', { __benchmark: true });
	});
	
	// Benchmark: Request without internal timings
	bench.add('Full request without __benchmark flag', async () => {
		await api.get('/json-small');
	});
}
