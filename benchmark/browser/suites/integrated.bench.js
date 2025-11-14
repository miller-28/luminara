// Integrated scenario benchmarks for browser environment
export const integratedBenchmarks = [
	{
		name: 'Scenario - Bare minimum GET',
		fn: async () => {
			const { createLuminara } = window;
			const api = createLuminara({
				baseURL: 'https://jsonplaceholder.typicode.com'
			});
			await api.get('/todos/1');
		}
	},
	{
		name: 'Scenario - GET with retry (success first attempt)',
		fn: async () => {
			const { createLuminara } = window;
			const api = createLuminara({
				baseURL: 'https://jsonplaceholder.typicode.com',
				retry: 3,
				retryDelay: 100
			});
			await api.get('/todos/1');
		}
	},
	{
		name: 'Scenario - GET with stats collection',
		fn: async () => {
			const { createLuminara } = window;
			const api = createLuminara({
				baseURL: 'https://jsonplaceholder.typicode.com',
				stats: true
			});
			await api.get('/todos/1');
		}
	},
	{
		name: 'Scenario - GET with 1 plugin',
		fn: async () => {
			const { createLuminara } = window;
			const api = createLuminara({
				baseURL: 'https://jsonplaceholder.typicode.com'
			});
			api.use({
				name: 'auth-plugin',
				onRequest(context) {
					context.req.headers = context.req.headers || {};
					context.req.headers['Authorization'] = 'Bearer token123';
				}
			});
			await api.get('/todos/1');
		}
	},
	{
		name: 'Scenario - GET with 3 plugins',
		fn: async () => {
			const { createLuminara } = window;
			const api = createLuminara({
				baseURL: 'https://jsonplaceholder.typicode.com'
			});
			api
				.use({
					name: 'auth',
					onRequest(ctx) {
						ctx.req.headers = ctx.req.headers || {};
						ctx.req.headers['Authorization'] = 'Bearer token';
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
			await api.get('/todos/1');
		}
	},
	{
		name: 'Scenario - GET with retry + backoff + stats',
		fn: async () => {
			const { createLuminara } = window;
			const api = createLuminara({
				baseURL: 'https://jsonplaceholder.typicode.com',
				retry: 3,
				retryDelay: 50,
				backoffType: 'exponential',
				stats: true
			});
			await api.get('/todos/1');
		}
	},
	{
		name: 'Scenario - POST with body + headers + plugin',
		fn: async () => {
			const { createLuminara } = window;
			const api = createLuminara({
				baseURL: 'https://jsonplaceholder.typicode.com'
			});
			api.use({
				name: 'auth',
				onRequest(ctx) {
					ctx.req.headers = ctx.req.headers || {};
					ctx.req.headers['Authorization'] = 'Bearer token123';
				}
			});
			
			await api.post('/posts', {
				title: 'Benchmark Test',
				body: 'Testing POST performance',
				userId: 1
			});
		}
	},
	{
		name: 'Scenario - Concurrent requests (3x GET)',
		fn: async () => {
			const { createLuminara } = window;
			const api = createLuminara({
				baseURL: 'https://jsonplaceholder.typicode.com'
			});
			
			await Promise.all([
				api.get('/todos/1'),
				api.get('/todos/2'),
				api.get('/todos/3')
			]);
		}
	},
	{
		name: 'Scenario - Concurrent with deduplication',
		fn: async () => {
			const { createLuminara } = window;
			const api = createLuminara({
				baseURL: 'https://jsonplaceholder.typicode.com',
				deduplicate: true
			});
			
			await Promise.all([
				api.get('/todos/1'),
				api.get('/todos/1'),
				api.get('/todos/1')
			]);
		}
	},
	{
		name: 'Scenario - Full featured client',
		fn: async () => {
			const { createLuminara } = window;
			const api = createLuminara({
				baseURL: 'https://jsonplaceholder.typicode.com',
				retry: 3,
				retryDelay: 100,
				backoffType: 'exponential',
				timeout: 5000,
				stats: true,
				rateLimit: { rps: 10 },
				deduplicate: true
			});
			
			api.use({
				name: 'full-plugin',
				onRequest(ctx) {
					ctx.req.headers = ctx.req.headers || {};
					ctx.req.headers['X-Client'] = 'Luminara-Benchmark';
				}
			});
			
			await api.get('/todos/1');
		}
	}
];
