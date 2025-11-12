// Core benchmarks for browser environment
export const coreBenchmarks = [
	{
		name: 'createLuminara() - cold start',
		fn: () => {
			const { createLuminara } = window;
			const api = createLuminara({ baseURL: 'http://localhost:9999' });
		}
	},
	{
		name: 'api.use() - register 1 plugin',
		fn: () => {
			const { createLuminara } = window;
			const api = createLuminara();
			api.use({
				name: 'test-plugin',
				onRequest: (ctx) => {}
			});
		}
	},
	{
		name: 'api.use() - register 10 plugins',
		fn: () => {
			const { createLuminara } = window;
			const api = createLuminara();
			for (let i = 0; i < 10; i++) {
				api.use({
					name: `plugin-${i}`,
					onRequest: (ctx) => {}
				});
			}
		}
	},
	{
		name: 'api.updateConfig() - simple update',
		fn: () => {
			const { createLuminara } = window;
			const api = createLuminara();
			api.updateConfig({ retry: 3 });
		}
	},
	{
		name: 'api.updateConfig() - complex update',
		fn: () => {
			const { createLuminara } = window;
			const api = createLuminara();
			api.updateConfig({
				retry: 3,
				retryDelay: 1000,
				timeout: 5000,
				headers: { 'X-Custom': 'value' },
				query: { page: 1, limit: 10 }
			});
		}
	}
];
