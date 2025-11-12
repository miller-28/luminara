// Features benchmarks for browser environment
export const featuresBenchmarks = [
	{
		name: 'Retry - Linear backoff (success first try)',
		fn: async () => {
			const { createLuminara } = window;
			const api = createLuminara({
				baseURL: 'https://jsonplaceholder.typicode.com',
				retry: 3,
				retryDelay: 10,
				backoffType: 'linear'
			});
			await api.get('/todos/1');
		}
	},
	{
		name: 'Retry - Exponential backoff (success first try)',
		fn: async () => {
			const { createLuminara } = window;
			const api = createLuminara({
				baseURL: 'https://jsonplaceholder.typicode.com',
				retry: 3,
				retryDelay: 10,
				backoffType: 'exponential'
			});
			await api.get('/todos/1');
		}
	},
	{
		name: 'Retry - Fibonacci backoff (success first try)',
		fn: async () => {
			const { createLuminara } = window;
			const api = createLuminara({
				baseURL: 'https://jsonplaceholder.typicode.com',
				retry: 3,
				retryDelay: 10,
				backoffType: 'fibonacci'
			});
			await api.get('/todos/1');
		}
	},
	{
		name: 'Stats - Query all requests',
		fn: () => {
			const { createLuminara } = window;
			const api = createLuminara({ stats: true });
			
			// Query stats (without actual requests, just benchmarking the query)
			api.statsHub.query({
				metric: 'count',
				timeWindow: 'sinceStart'
			});
		}
	},
	{
		name: 'Stats - Query with filters',
		fn: () => {
			const { createLuminara } = window;
			const api = createLuminara({ stats: true });
			
			api.statsHub.query({
				metric: 'timing',
				filter: { minDuration: 100 },
				timeWindow: 'rolling60s'
			});
		}
	},
	{
		name: 'Deduplication - Same request twice',
		fn: async () => {
			const { createLuminara } = window;
			const api = createLuminara({
				baseURL: 'https://jsonplaceholder.typicode.com',
				deduplicate: true
			});
			
			// Fire two identical requests - should deduplicate
			await Promise.all([
				api.get('/todos/1'),
				api.get('/todos/1')
			]);
		}
	},
	{
		name: 'Debouncing - Rapid requests',
		fn: async () => {
			const { createLuminara } = window;
			const api = createLuminara({
				baseURL: 'https://jsonplaceholder.typicode.com',
				debounce: { delay: 50 }
			});
			
			// Last request wins
			try {
				await api.get('/todos/1');
			} catch (e) {
				// First requests get cancelled, that's expected
			}
		}
	},
	{
		name: 'Rate Limiting - With tokens',
		fn: async () => {
			const { createLuminara } = window;
			const api = createLuminara({
				baseURL: 'https://jsonplaceholder.typicode.com',
				rateLimit: { rps: 10 }
			});
			await api.get('/todos/1');
		}
	}
];
