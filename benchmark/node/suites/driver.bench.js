/**
 * Driver Layer Benchmarks
 * Tests: NativeFetchDriver phases (Pre-Flight, In-Flight, Post-Flight)
 */

export async function driverBenchmarks(bench, mockServer, config) {
	const { createLuminara, NativeFetchDriver } = await import('../../../dist/index.mjs');
	
	const baseURL = `http://localhost:${mockServer.port}`;
	const api = createLuminara({ baseURL });
	
	// ========== Pre-Flight Phase Benchmarks ==========
	
	// Benchmark: URL building - simple
	bench.add('Pre-Flight - URL building (simple path)', () => {
		const url = new URL('/test', baseURL);
		url.toString();
	});
	
	// Benchmark: URL building - with query params
	bench.add('Pre-Flight - URL building (10 query params)', () => {
		const url = new URL('/test', baseURL);
		for (let i = 0; i < 10; i++) {
			url.searchParams.append(`param${i}`, `value${i}`);
		}
		url.toString();
	});
	
	// Benchmark: Headers preparation
	bench.add('Pre-Flight - Headers preparation', () => {
		const headers = new Headers();
		headers.set('Content-Type', 'application/json');
		headers.set('Accept', 'application/json');
		headers.set('X-Custom', 'value');
	});
	
	// ========== In-Flight Phase Benchmarks ==========
	
	// Benchmark: Native fetch call - minimal overhead
	
	bench.add('In-Flight - Native fetch (GET JSON 1KB)', async () => {
		await api.get('/json-small');
	});
	
	bench.add('In-Flight - Native fetch (GET JSON 10KB)', async () => {
		await api.get('/json-medium');
	});
	
	bench.add('In-Flight - Native fetch (GET JSON 100KB)', async () => {
		await api.get('/json-large');
	});
	
	// Benchmark: Request with timeout
	const timeoutApi = createLuminara({
		baseURL,
		timeout: 5000
	});
	
	bench.add('In-Flight - Request with timeout (no timeout)', async () => {
		await timeoutApi.get('/json-small');
	});
	
	// ========== Post-Flight Phase Benchmarks ==========
	
	// Benchmark: Response parsing - JSON
	const jsonData = JSON.stringify({ message: 'test', data: 'x'.repeat(1024) });
	
	bench.add('Post-Flight - JSON parse (1KB)', () => {
		JSON.parse(jsonData);
	});
	
	const largeJsonData = JSON.stringify({ 
		message: 'test', 
		data: 'x'.repeat(100 * 1024) 
	});
	
	bench.add('Post-Flight - JSON parse (100KB)', () => {
		JSON.parse(largeJsonData);
	});
	
	// Benchmark: Response parsing - text
	const textData = 'Hello World '.repeat(100);
	
	bench.add('Post-Flight - Text response (1KB)', () => {
		const text = textData;
	});
	
	// Benchmark: Typed response methods
	bench.add('Typed Request - getJson()', async () => {
		await api.getJson('/json-small');
	});
	
	bench.add('Typed Request - getText()', async () => {
		await api.getText('/text');
	});
	
	bench.add('Typed Request - getBlob()', async () => {
		await api.getBlob('/blob');
	});
	
	// ========== HTTP Verb Benchmarks ==========
	
	bench.add('HTTP Verb - GET', async () => {
		await api.get('/json-small');
	});
	
	bench.add('HTTP Verb - POST with JSON body', async () => {
		await api.post('/json-small', { data: 'test' });
	});
	
	bench.add('HTTP Verb - PUT with JSON body', async () => {
		await api.put('/json-small', { data: 'test' });
	});
	
	bench.add('HTTP Verb - PATCH with JSON body', async () => {
		await api.patch('/json-small', { data: 'test' });
	});
	
	bench.add('HTTP Verb - DELETE', async () => {
		await api.del('/json-small');
	});
	
	// ========== Request Configuration Overhead ==========
	
	// Benchmark: Simple GET (minimal config)
	bench.add('Config - Minimal (no options)', async () => {
		await api.get('/json-small');
	});
	
	// Benchmark: GET with headers
	bench.add('Config - With headers', async () => {
		await api.get('/json-small', {
			headers: {
				'X-Custom-1': 'value1',
				'X-Custom-2': 'value2',
				'X-Custom-3': 'value3'
			}
		});
	});
	
	// Benchmark: GET with query params
	bench.add('Config - With query params', async () => {
		await api.get('/json-small', {
			query: {
				page: 1,
				limit: 10,
				sort: 'name',
				filter: 'active'
			}
		});
	});
	
	// Benchmark: POST with all options
	bench.add('Config - Complex (all options)', async () => {
		await api.post('/json-small', { data: 'test' }, {
			headers: {
				'X-Custom': 'value'
			},
			timeout: 5000,
			retry: 3,
			retryDelay: 100
		});
	});
}
