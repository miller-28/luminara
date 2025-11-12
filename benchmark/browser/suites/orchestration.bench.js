// Orchestration benchmarks for browser environment
export const orchestrationBenchmarks = [
	{
		name: 'PluginPipeline - empty onRequest',
		fn: async () => {
			const { PluginPipeline } = await import('../../../dist/index.mjs');
			const pipeline = new PluginPipeline([]);
			const context = { req: { url: '/test', method: 'GET' } };
			await pipeline.executeOnRequest(context);
		}
	},
	{
		name: 'PluginPipeline - empty onResponse',
		fn: async () => {
			const { PluginPipeline } = await import('../../../dist/index.mjs');
			const pipeline = new PluginPipeline([]);
			const context = { req: {}, res: { data: 'test' } };
			await pipeline.executeOnResponse(context);
		}
	},
	{
		name: 'PluginPipeline - 5 plugins onRequest',
		fn: async () => {
			const { PluginPipeline } = await import('../../../dist/index.mjs');
			const plugins = Array(5).fill(null).map((_, i) => ({
				name: `plugin-${i}`,
				onRequest: (ctx) => {}
			}));
			const pipeline = new PluginPipeline(plugins);
			const context = { req: { url: '/test', method: 'GET' } };
			await pipeline.executeOnRequest(context);
		}
	},
	{
		name: 'ContextBuilder - simple request',
		fn: async () => {
			const { ContextBuilder } = await import('../../../dist/index.mjs');
			const builder = new ContextBuilder();
			builder.build({ url: '/test', method: 'GET' }, {}, null);
		}
	},
	{
		name: 'ContextBuilder - complex request',
		fn: async () => {
			const { ContextBuilder } = await import('../../../dist/index.mjs');
			const builder = new ContextBuilder();
			builder.build(
				{ 
					url: '/api/users', 
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ name: 'John' })
				}, 
				{ retry: 3, timeout: 5000 },
				null
			);
		}
	}
];
