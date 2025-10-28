import { createLuminara } from '../../src/index.js';
import { TestSuite, MockServer, assert, assertRange, Timer } from '../testUtils.js';
import { fileURLToPath } from 'url';

const suite = new TestSuite('Backoff Strategies');
const mockServer = new MockServer(3002);

// Test all backoff strategies with timing validation
suite.test('Linear backoff timing', async () => {
	const api = createLuminara({
		baseURL: 'http://localhost:3002',
		retry: 3,
		retryDelay: 100,
		backoffType: 'linear'
	});
	
	const timer = new Timer();
	timer.mark(); // Start
	
	try {
		await api.getJson('/json?status=500');
	} catch (error) {
		// Expected to fail after retries
	}
	
	timer.mark(); // End
	
	const totalTime = timer.getDuration();
	// Linear: 100ms + 100ms + 100ms = ~300ms + request times
	// Allow for request overhead: 250ms - 500ms range
	assertRange(totalTime, 250, 500, `Linear backoff timing should be ~300ms, got ${totalTime}ms`);
});

suite.test('Exponential backoff timing', async () => {
	const api = createLuminara({
		baseURL: 'http://localhost:3002',
		retry: 4,
		retryDelay: 50,
		backoffType: 'exponential'
	});
	
	const timer = new Timer();
	timer.mark();
	
	try {
		await api.getJson('/json?status=503');
	} catch (error) {
		// Expected to fail
	}
	
	timer.mark();
	
	const totalTime = timer.getDuration();
	// Exponential: 100ms + 200ms + 400ms + 800ms = 1500ms
	// Allow overhead: 1400ms - 1700ms
	assertRange(totalTime, 1400, 1700, `Exponential backoff timing should be ~1500ms, got ${totalTime}ms`);
});

suite.test('Exponential capped backoff', async () => {
	const api = createLuminara({
		baseURL: 'http://localhost:3002',
		retry: 5,
		retryDelay: 100,
		backoffType: 'exponentialCapped',
		backoffMaxDelay: 300
	});
	
	const timer = new Timer();
	timer.mark();
	
	try {
		await api.getJson('/json?status=502');
	} catch (error) {
		// Expected to fail
	}
	
	timer.mark();
	
	const totalTime = timer.getDuration();
	// Capped: 200ms + 300ms + 300ms + 300ms + 300ms = 1400ms
	// Allow overhead: 1300ms - 1600ms
	assertRange(totalTime, 1300, 1600, `Capped exponential should be ~1400ms, got ${totalTime}ms`);
});

suite.test('Fibonacci backoff pattern', async () => {
	const api = createLuminara({
		baseURL: 'http://localhost:3002',
		retry: 6,
		retryDelay: 50,
		backoffType: 'fibonacci'
	});
	
	const timer = new Timer();
	timer.mark();
	
	try {
		await api.getJson('/json?status=500');
	} catch (error) {
		// Expected to fail
	}
	
	timer.mark();
	
	const totalTime = timer.getDuration();
	// Fibonacci: 50 + 50 + 100 + 150 + 250 + 400 = 1000ms
	// Allow overhead: 900ms - 1200ms
	assertRange(totalTime, 900, 1200, `Fibonacci backoff should be ~1000ms, got ${totalTime}ms`);
});

suite.test('Jitter backoff randomization', async () => {
	const api = createLuminara({
		baseURL: 'http://localhost:3002',
		retry: 3,
		retryDelay: 200,
		backoffType: 'jitter'
	});
	
	// Run multiple times to test randomization
	const timings = [];
	
	for (let i = 0; i < 3; i++) {
		mockServer.resetCounts();
		const timer = new Timer();
		timer.mark();
		
		try {
			await api.getJson('/json?status=429');
		} catch (error) {
			// Expected to fail
		}
		
		timer.mark();
		timings.push(timer.getDuration());
	}
	
	// Jitter should produce different timings
	const allSame = timings.every(t => Math.abs(t - timings[0]) < 50);
	assert(!allSame, 'Jitter should produce varied timings across runs');
	
	// But all should be within reasonable bounds (200ms + jitter * 3 retries)
	// Base: 200 + (0-200 jitter) = 200-400ms per retry
	// Total for 3 retries: 600-1200ms + overhead
	timings.forEach(timing => {
		assertRange(timing, 600, 1400, `Jitter timing should be reasonable: ${timing}ms`);
	});
});

suite.test('Exponential jitter combination', async () => {
	const api = createLuminara({
		baseURL: 'http://localhost:3002',
		retry: 4,
		retryDelay: 100,
		backoffType: 'exponentialJitter',
		backoffMaxDelay: 1000
	});
	
	const timer = new Timer();
	timer.mark();
	
	try {
		await api.getJson('/json?status=503');
	} catch (error) {
		// Expected to fail
	}
	
	timer.mark();
	
	const totalTime = timer.getDuration();
	// Should be longer than linear but with jitter variation
	// Exponential base would be: 200 + 400 + 800 + 1000(capped) = 2400ms
	// With jitter (0-100 each): +0-400ms = 2400-2800ms + overhead
	assertRange(totalTime, 2200, 3000, `Exponential jitter should be varied, got ${totalTime}ms`);
});

suite.test('Custom retry handler timing', async () => {
	let retryAttempts = 0;
	
	const api = createLuminara({
		baseURL: 'http://localhost:3002',
		retry: 3,
		retryDelay: (context) => {
			retryAttempts++;
			return 150; // Fixed 150ms delay
		}
	});
	
	const timer = new Timer();
	timer.mark();
	
	try {
		await api.getJson('/json?status=500');
	} catch (error) {
		// Expected to fail
	}
	
	timer.mark();
	
	assert(retryAttempts === 3, `Should make 3 retry attempts, made ${retryAttempts}`);
	
	const totalTime = timer.getDuration();
	// Custom: 150ms * 3 = 450ms
	// Allow overhead: 400ms - 650ms
	assertRange(totalTime, 400, 650, `Custom retry timing should be ~450ms, got ${totalTime}ms`);
});

suite.test('Backoff with eventual success', async () => {
	// Set up server to fail twice, then succeed
	let requestCount = 0;
	const originalHandler = mockServer.handleRequest;
	
	mockServer.handleRequest = function(req, res, path, params) {
		if (path === '/eventual-success') {
			requestCount++;
			if (requestCount <= 2) {
				// Fail first two requests
				res.writeHead(503, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify({ error: 'Temporary failure' }));
				return;
			}
			// Succeed on third request
			res.writeHead(200, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ message: 'Success after retries', attempt: requestCount }));
			return;
		}
		
		// Fallback to original handler
		originalHandler.call(this, req, res, path, params);
	};
	
	const api = createLuminara({
		baseURL: 'http://localhost:3002',
		retry: 3,
		retryDelay: 100,
		backoffType: 'linear'
	});
	
	const response = await api.getJson('/eventual-success');
	
	assert(response.status === 200, 'Should eventually succeed');
	assert(response.data.attempt === 3, `Should succeed on 3rd attempt, got ${response.data.attempt}`);
	assert(requestCount === 3, `Should make 3 requests total, made ${requestCount}`);
	
	// Restore original handler
	mockServer.handleRequest = originalHandler;
});

// Run tests if this file is executed directly
if (fileURLToPath(import.meta.url) === process.argv[1]) {
	console.log('🧪 Running Backoff Strategies Tests...');
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