// Driver Layer benchmarks for browser environment
export const driverBenchmarks = [
	{
		name: 'Pre-Flight - URL building (simple path)',
		fn: () => {
			const url = new URL('/test', 'http://localhost:9999');
			url.toString();
		}
	},
	{
		name: 'Pre-Flight - URL building (10 query params)',
		fn: () => {
			const url = new URL('/test', 'http://localhost:9999');
			for (let i = 0; i < 10; i++) {
				url.searchParams.append(`param${i}`, `value${i}`);
			}
			url.toString();
		}
	},
	{
		name: 'Pre-Flight - Headers preparation',
		fn: () => {
			const headers = new Headers();
			headers.set('Content-Type', 'application/json');
			headers.set('Accept', 'application/json');
			headers.set('X-Custom', 'value');
		}
	},
	{
		name: 'In-Flight - Fetch with headers',
		fn: async () => {
			const { createLuminara } = window;
			const api = createLuminara({ 
				baseURL: 'https://jsonplaceholder.typicode.com',
				headers: { 'X-Test': 'value' }
			});
			await api.get('/todos/1');
		}
	},
	{
		name: 'In-Flight - Request with timeout',
		fn: async () => {
			const { createLuminara } = window;
			const api = createLuminara({ 
				baseURL: 'https://jsonplaceholder.typicode.com',
				timeout: 5000
			});
			await api.get('/todos/1');
		}
	},
	{
		name: 'Post-Flight - JSON parse (1KB)',
		fn: () => {
			const jsonData = JSON.stringify({ message: 'test', data: 'x'.repeat(1024) });
			JSON.parse(jsonData);
		}
	},
	{
		name: 'Post-Flight - JSON parse (10KB)',
		fn: () => {
			const jsonData = JSON.stringify({ message: 'test', data: 'x'.repeat(10 * 1024) });
			JSON.parse(jsonData);
		}
	},
	{
		name: 'Post-Flight - Response parsing (text)',
		fn: async () => {
			const { createLuminara } = window;
			const api = createLuminara({ baseURL: 'https://jsonplaceholder.typicode.com' });
			await api.getText('/todos/1');
		}
	}
];
