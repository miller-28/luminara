import { createLuminara, defaultRetryPolicy, createRetryPolicy, parseRetryAfter, isIdempotentMethod } from '../../src/index.js';
import { TestSuite, MockServer, assert, assertEqual } from '../testUtils.js';
import { fileURLToPath } from 'url';

const suite = new TestSuite('Advanced Retry Policies');
const mockServer = new MockServer(4213);

// Test 1: Idempotent method detection
suite.test('Idempotent method detection', async () => {
	assert(isIdempotentMethod('GET'), 'GET should be idempotent');
	assert(isIdempotentMethod('PUT'), 'PUT should be idempotent');
	assert(isIdempotentMethod('DELETE'), 'DELETE should be idempotent');
	assert(!isIdempotentMethod('POST'), 'POST should not be idempotent');
	assert(!isIdempotentMethod('PATCH'), 'PATCH should not be idempotent');
});

// Test 2: Retry-After header parsing
suite.test('Retry-After header parsing (seconds)', async () => {
	const delay = parseRetryAfter('5');
	assertEqual(delay, 5000, 'Should parse seconds correctly');
});

suite.test('Retry-After header parsing (HTTP-date)', async () => {
	const futureDate = new Date(Date.now() + 10000).toUTCString();
	const delay = parseRetryAfter(futureDate);
	assert(delay >= 8000 && delay <= 12000, `Should parse HTTP-date correctly, got ${delay}ms`);
});

suite.test('Retry-After header parsing (invalid)', async () => {
	const delay = parseRetryAfter('invalid');
	assertEqual(delay, 0, 'Should return 0 for invalid input');
});

// Test 3: Default retry policy for GET requests (idempotent)
suite.test('Default policy retries GET on 500 status', async () => {
	const luminara = createLuminara();
	const baseURL = `http://localhost:${mockServer.port}`;

	try {
		await luminara.get(`${baseURL}/json?status=500&delay=50`, {
			retry: 2,
			retryDelay: 100,
			timeout: 10000
		});
		assert(false, 'Should have thrown an error');
	} catch (error) {
		assert(error.message.includes('500'), 'Should get 500 error after retries');
	}
});

// Test 4: Default policy retries POST on safe status codes
suite.test('Default policy retries POST on safe status codes', async () => {
	const luminara = createLuminara();
	const baseURL = `http://localhost:${mockServer.port}`;

	try {
		await luminara.post(`${baseURL}/json?status=500`, { data: 'test' }, {
			retry: 2,
			retryDelay: 100,
			timeout: 5000
		});
		assert(false, 'Should have thrown an error');
	} catch (error) {
		assert(error.message.includes('500'), 'Should get 500 error after retries');
	}
});

// Test 5: Custom retry policy
suite.test('Custom retry policy overrides default behavior', async () => {
	const customPolicy = (error, context) => {
		// Always retry regardless of method or status (for testing)
		return context.attempt < context.maxAttempts;
	};

	const luminara = createLuminara();
	const baseURL = `http://localhost:${mockServer.port}`;

	try {
		await luminara.post(`${baseURL}/json?status=400`, { data: 'test' }, {
			retry: 2,
			retryDelay: 100,
			shouldRetry: customPolicy,
			timeout: 5000
		});
		assert(false, 'Should have thrown an error');
	} catch (error) {
		assert(error.message.includes('400'), 'Should get 400 error after custom retries');
	}
});

// Test 6: Network error retry for idempotent methods
suite.test('Network errors retry for idempotent methods', async () => {
	const luminara = createLuminara();

	try {
		// Use invalid URL to trigger network error
		await luminara.get('http://invalid-host-that-does-not-exist.local/test', {
			retry: 1,
			retryDelay: 100,
			timeout: 1000
		});
		assert(false, 'Should have thrown an error');
	} catch (error) {
		assert(error.name === 'TypeError' || error.name === 'TimeoutError', `Expected network/timeout error, got ${error.name}`);
	}
});

// Test 7: Retry timing
suite.test('Retry-After header is respected (timing)', async () => {
	const luminara = createLuminara();
	const baseURL = `http://localhost:${mockServer.port}`;
	const startTime = Date.now();

	try {
		await luminara.get(`${baseURL}/json?status=429`, {
			retry: 1,
			retryDelay: 200,
			timeout: 5000
		});
		assert(false, 'Should have thrown an error');
	} catch (error) {
		const duration = Date.now() - startTime;
		assert(duration >= 150, `Retry too fast: ${duration}ms, expected at least 150ms`);
	}
});

// Test 8: Status code 409 triggers retry for idempotent methods
suite.test('Status 409 triggers retry for GET requests', async () => {
	const luminara = createLuminara();
	const baseURL = `http://localhost:${mockServer.port}`;

	try {
		await luminara.get(`${baseURL}/json?status=409`, {
			retry: 1,
			retryDelay: 100,
			timeout: 5000
		});
		assert(false, 'Should have thrown an error');
	} catch (error) {
		assert(error.message.includes('409'), 'Should get 409 error after retries');
	}
});

// Test 9: Status code 425 triggers retry for idempotent methods
suite.test('Status 425 triggers retry for PUT requests', async () => {
	const luminara = createLuminara();
	const baseURL = `http://localhost:${mockServer.port}`;

	try {
		await luminara.put(`${baseURL}/json?status=425`, { data: 'test' }, {
			retry: 1,
			retryDelay: 100,
			timeout: 5000
		});
		assert(false, 'Should have thrown an error');
	} catch (error) {
		assert(error.message.includes('425'), 'Should get 425 error after retries');
	}
});

// Test 10: createRetryPolicy with custom status codes
suite.test('createRetryPolicy allows custom status codes', async () => {
	const customRetryStatusCodes = new Set([418]); // I'm a teapot
	const customPolicy = createRetryPolicy({ 
		retryStatusCodes: customRetryStatusCodes 
	});

	const context = {
		request: { method: 'GET' },
		attempt: 1,
		maxAttempts: 3
	};

	const shouldRetry418 = customPolicy({ status: 418 }, context);
	const shouldRetry500 = customPolicy({ status: 500 }, context);

	assert(shouldRetry418, 'Should retry on custom status 418');
	assert(!shouldRetry500, 'Should not retry on default status 500 with custom policy');
});

// Run tests if this file is executed directly
if (fileURLToPath(import.meta.url) === process.argv[1]) {
	console.log('🧪 Running Advanced Retry Policies Tests...');
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