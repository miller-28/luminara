import { createLuminara } from '../../src/index.js';
import { TestSuite, MockServer, assert, assertEqual } from '../testUtils.js';
import { runTestSuiteIfDirect } from '../runTestSuite.js';

const suite = new TestSuite('Basic HTTP Operations');
const mockServer = new MockServer(4221);
const BASE_URL = `http://localhost:${mockServer.port}`;

// Test basic HTTP methods as they would be used in React apps
suite.test('GET JSON request', async () => {
	const api = createLuminara({ baseURL: BASE_URL });
	
	const response = await api.getJson('/json');
	
	assert(response.status === 200, 'Should return 200 status');
	assert(response.data.message === 'Success', 'Should return success message');
	assert(response.data.method === 'GET', 'Should record GET method');
});

suite.test('POST JSON request', async () => {
	const api = createLuminara({ baseURL: BASE_URL });
	
	const payload = { name: 'Test User', email: 'test@example.com' };
	const response = await api.postJson('/json', payload);
	
	assert(response.status === 200, 'Should return 200 status');
	assert(response.data.method === 'POST', 'Should record POST method');
});

suite.test('GET Text request', async () => {
	const api = createLuminara({ baseURL: BASE_URL });
	
	const response = await api.getText('/text');
	
	assert(response.status === 200, 'Should return 200 status');
	assert(typeof response.data === 'string', 'Should return string data');
	assert(response.data.includes('Success'), 'Should contain success message');
});

suite.test('POST Form data', async () => {
	const api = createLuminara({ baseURL: BASE_URL });
	
	const formData = { username: 'testuser', password: 'secret123' };
	const response = await api.postForm('/form', formData);
	
	assert(response.status === 200, 'Should return 200 status');
	assert(response.data.message === 'Form received', 'Should confirm form reception');
});

suite.test('Base URL configuration', async () => {
	const api = createLuminara({ 
		baseURL: BASE_URL,
		headers: { 'X-Test': 'base-url-test' }
	});
	
	// Should work with relative paths when baseURL is set
	const response = await api.getJson('/json');
	
	assert(response.status === 200, 'Should work with relative URL');
	assert(response.data.message === 'Success', 'Should return success');
});

suite.test('Query parameters', async () => {
	const api = createLuminara({ baseURL: BASE_URL });
	
	const response = await api.get('/json', {
		query: { test: 'query-params', value: 123 }
	});
	
	assert(response.status === 200, 'Should handle query parameters');
});

suite.test('Custom headers', async () => {
	const api = createLuminara({ 
		baseURL: BASE_URL,
		headers: { 'Authorization': 'Bearer test-token' }
	});
	
	const response = await api.getJson('/json', {
		headers: { 'X-Custom': 'test-header' }
	});
	
	assert(response.status === 200, 'Should handle custom headers');
});

suite.test('PUT request', async () => {
	const api = createLuminara({ baseURL: BASE_URL });
	
	const response = await api.put('/json', { id: 1, updated: true });
	
	assert(response.status === 200, 'Should handle PUT requests');
	assert(response.data.method === 'PUT', 'Should record PUT method');
});

suite.test('PATCH request', async () => {
	const api = createLuminara({ baseURL: BASE_URL });
	
	const response = await api.patch('/json', { status: 'updated' });
	
	assert(response.status === 200, 'Should handle PATCH requests');
	assert(response.data.method === 'PATCH', 'Should record PATCH method');
});

suite.test('DELETE request', async () => {
	const api = createLuminara({ baseURL: BASE_URL });
	
	const response = await api.del('/json');
	
	assert(response.status === 200, 'Should handle DELETE requests');
	assert(response.data.method === 'DELETE', 'Should record DELETE method');
});

// Test all core HTTP verbs
suite.test('HEAD request', async () => {
	const api = createLuminara({ baseURL: BASE_URL });
	
	const response = await api.head('/json');
	
	assert(response.status === 200, 'Should handle HEAD requests');
	// HEAD requests by HTTP spec should not return body content
});

suite.test('OPTIONS request', async () => {
	const api = createLuminara({ baseURL: BASE_URL });
	
	// Test that OPTIONS request completes successfully
	// Note: Some HTTP implementations may not return body content for OPTIONS
	const response = await api.options('/json');
	
	assert(response.status === 200, 'Should handle OPTIONS requests');
	// OPTIONS may not return body content in some implementations
	// Just verify it completes successfully
});

// Test typed GET helpers (response content types)
suite.test('getText helper', async () => {
	const api = createLuminara({ baseURL: BASE_URL });
	
	const response = await api.getText('/text');
	
	assert(response.status === 200, 'Should return 200 status');
	assert(typeof response.data === 'string', 'Should return string data');
	assert(response.data.includes('Success'), 'Should contain success message');
});

suite.test('getXml helper', async () => {
	const api = createLuminara({ baseURL: BASE_URL });
	
	const response = await api.getXml('/xml');
	
	assert(response.status === 200, 'Should handle XML requests');
	assert(typeof response.data === 'string', 'Should return XML as string');
	assert(response.data.includes('<?xml'), 'Should contain XML declaration');
});

suite.test('getHtml helper', async () => {
	const api = createLuminara({ baseURL: BASE_URL });
	
	const response = await api.getHtml('/html');
	
	assert(response.status === 200, 'Should handle HTML requests');
	assert(typeof response.data === 'string', 'Should return HTML as string');
	assert(response.data.includes('<html>'), 'Should contain HTML tags');
});

suite.test('getBlob helper', async () => {
	const api = createLuminara({ baseURL: BASE_URL });
	
	const response = await api.getBlob('/blob');
	
	assert(response.status === 200, 'Should handle Blob requests');
	assert(response.data instanceof Blob, 'Should return Blob object');
});

suite.test('getArrayBuffer helper', async () => {
	const api = createLuminara({ baseURL: BASE_URL });
	
	const response = await api.getArrayBuffer('/arraybuffer');
	
	assert(response.status === 200, 'Should handle ArrayBuffer requests');
	assert(response.data instanceof ArrayBuffer, 'Should return ArrayBuffer object');
});

suite.test('getNDJSON helper', async () => {
	const api = createLuminara({ baseURL: BASE_URL });
	
	const response = await api.getNDJSON('/ndjson');
	
	assert(response.status === 200, 'Should handle NDJSON requests');
	assert(typeof response.data === 'string', 'Should return NDJSON as string');
	assert(response.data.includes('\n'), 'Should contain newline separators');
});

// Test typed POST/PUT/PATCH helpers (request content types)
suite.test('putJson helper', async () => {
	const api = createLuminara({ baseURL: BASE_URL });
	
	const payload = { id: 1, name: 'Updated User' };
	const response = await api.putJson('/json', payload);
	
	assert(response.status === 200, 'Should handle PUT JSON requests');
	assert(response.data.method === 'PUT', 'Should record PUT method');
});

suite.test('patchJson helper', async () => {
	const api = createLuminara({ baseURL: BASE_URL });
	
	const payload = { status: 'active' };
	const response = await api.patchJson('/json', payload);
	
	assert(response.status === 200, 'Should handle PATCH JSON requests');
	assert(response.data.method === 'PATCH', 'Should record PATCH method');
});

suite.test('postText helper', async () => {
	const api = createLuminara({ baseURL: BASE_URL });
	
	const textData = 'This is plain text content';
	const response = await api.postText('/text', textData);
	
	assert(response.status === 200, 'Should handle text POST requests');
	// postText returns text responseType, so response.data is the raw JSON string
	// Parse it to check the message
	const responseData = JSON.parse(response.data);
	assert(responseData.message === 'Text received', 'Should confirm text reception');
});

suite.test('postMultipart helper', async () => {
	const api = createLuminara({ baseURL: BASE_URL });
	
	const formData = new FormData();
	formData.append('file', new Blob(['test content'], { type: 'text/plain' }), 'test.txt');
	formData.append('description', 'Test file upload');
	
	const response = await api.postMultipart('/multipart', formData);
	
	assert(response.status === 200, 'Should handle multipart requests');
	assert(response.data.message === 'Multipart received', 'Should confirm multipart reception');
});

suite.test('postSoap helper (SOAP 1.1)', async () => {
	const api = createLuminara({ baseURL: BASE_URL });
	
	const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
	<soap:Body>
		<GetUser xmlns="http://example.com/webservice">
			<UserId>123</UserId>
		</GetUser>
	</soap:Body>
</soap:Envelope>`;
	
	const response = await api.postSoap('/soap', soapEnvelope, {
		headers: { 'SOAPAction': 'http://example.com/webservice/GetUser' }
	});
	
	assert(response.status === 200, 'Should handle SOAP 1.1 requests');
	assert(response.data.message === 'SOAP received', 'Should confirm SOAP reception');
});

suite.test('postSoap helper (SOAP 1.2)', async () => {
	const api = createLuminara({ baseURL: BASE_URL });
	
	const soap12Envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
	<soap:Body>
		<GetUser xmlns="http://example.com/webservice">
			<UserId>456</UserId>
		</GetUser>
	</soap:Body>
</soap:Envelope>`;
	
	const response = await api.postSoap('/soap', soap12Envelope, {
		headers: { 
			'Content-Type': 'application/soap+xml; action="http://example.com/webservice/GetUser"'
		}
	});
	
	assert(response.status === 200, 'Should handle SOAP 1.2 requests');
	assert(response.data.message === 'SOAP received', 'Should confirm SOAP reception');
});

// Run tests if this file is executed directly
await runTestSuiteIfDirect(import.meta.url, 'Basic HTTP Operations', suite, mockServer);

export { suite, mockServer };
