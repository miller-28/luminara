import { createLuminara } from '../../src/index.js';
import { TestSuite, MockServer, assert, assertEqual } from '../testUtils.js';
import { fileURLToPath } from 'url';

const suite = new TestSuite('Basic HTTP Operations');
const mockServer = new MockServer(4211); // Use different port to avoid conflicts

// Test basic HTTP methods as they would be used in React apps
suite.test('GET JSON request', async () => {
	const api = createLuminara({ baseURL: 'http://localhost:4211' });
	
	const response = await api.getJson('/json');
	
	assert(response.status === 200, 'Should return 200 status');
	assert(response.data.message === 'Success', 'Should return success message');
	assert(response.data.method === 'GET', 'Should record GET method');
});

suite.test('POST JSON request', async () => {
	const api = createLuminara({ baseURL: 'http://localhost:4211' });
	
	const payload = { name: 'Test User', email: 'test@example.com' };
	const response = await api.postJson('/json', payload);
	
	assert(response.status === 200, 'Should return 200 status');
	assert(response.data.method === 'POST', 'Should record POST method');
});

suite.test('GET Text request', async () => {
	const api = createLuminara({ baseURL: 'http://localhost:4211' });
	
	const response = await api.getText('/text');
	
	assert(response.status === 200, 'Should return 200 status');
	assert(typeof response.data === 'string', 'Should return string data');
	assert(response.data.includes('Success'), 'Should contain success message');
});

suite.test('POST Form data', async () => {
	const api = createLuminara({ baseURL: 'http://localhost:4211' });
	
	const formData = { username: 'testuser', password: 'secret123' };
	const response = await api.postForm('/form', formData);
	
	assert(response.status === 200, 'Should return 200 status');
	assert(response.data.message === 'Form received', 'Should confirm form reception');
});

suite.test('Base URL configuration', async () => {
	const api = createLuminara({ 
		baseURL: 'http://localhost:4211',
		headers: { 'X-Test': 'base-url-test' }
	});
	
	// Should work with relative paths when baseURL is set
	const response = await api.getJson('/json');
	
	assert(response.status === 200, 'Should work with relative URL');
	assert(response.data.message === 'Success', 'Should return success');
});

suite.test('Query parameters', async () => {
	const api = createLuminara({ baseURL: 'http://localhost:4211' });
	
	const response = await api.get('/json', {
		query: { test: 'query-params', value: 123 }
	});
	
	assert(response.status === 200, 'Should handle query parameters');
});

suite.test('Custom headers', async () => {
	const api = createLuminara({ 
		baseURL: 'http://localhost:4211',
		headers: { 'Authorization': 'Bearer test-token' }
	});
	
	const response = await api.getJson('/json', {
		headers: { 'X-Custom': 'test-header' }
	});
	
	assert(response.status === 200, 'Should handle custom headers');
});

suite.test('PUT request', async () => {
	const api = createLuminara({ baseURL: 'http://localhost:4211' });
	
	const response = await api.put('/json', { id: 1, updated: true });
	
	assert(response.status === 200, 'Should handle PUT requests');
	assert(response.data.method === 'PUT', 'Should record PUT method');
});

suite.test('PATCH request', async () => {
	const api = createLuminara({ baseURL: 'http://localhost:4211' });
	
	const response = await api.patch('/json', { status: 'updated' });
	
	assert(response.status === 200, 'Should handle PATCH requests');
	assert(response.data.method === 'PATCH', 'Should record PATCH method');
});

suite.test('DELETE request', async () => {
	const api = createLuminara({ baseURL: 'http://localhost:4211' });
	
	const response = await api.del('/json');
	
	assert(response.status === 200, 'Should handle DELETE requests');
	assert(response.data.method === 'DELETE', 'Should record DELETE method');
});

// Run tests if this file is executed directly
if (fileURLToPath(import.meta.url) === process.argv[1]) {
	console.log('🧪 Running Basic HTTP Operations Tests...');
	await mockServer.start();
	
	try {
		const results = await suite.run();
		console.log(`✅ Tests completed: ${results.passed}/${results.total} passed`);
		process.exit(results.failed > 0 ? 1 : 0);
	} finally {
		await mockServer.stop();
	}
}

export { suite, mockServer };
