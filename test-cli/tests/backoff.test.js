import { createLuminara } from '../../src/index.js';
import { TestSuite, MockServer, assert, assertRange, Timer } from '../testUtils.js';
import { runTestSuiteIfDirect } from '../runTestSuite.js';

const suite = new TestSuite('Backoff Strategies');
const mockServer = new MockServer(4220);
const BASE_URL = `http://localhost:${mockServer.port}`;

// Test all backoff strategies with timing validation
suite.test('Linear backoff timing', async () => {
	const api = createLuminara({
		baseURL: BASE_URL,
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

	// Linear: 100ms + 100ms + 100ms = ~300ms backoff
	// Plus base latency: 4 requests × 100ms avg = ~400ms
	// Total expected: ~700ms, allow generous tolerance for system variations
	assertRange(totalTime, 300, 1200, `Linear backoff timing should be ~700ms, got ${totalTime}ms`);
});

suite.test('Exponential backoff timing', async () => {
	const api = createLuminara({
		baseURL: BASE_URL,
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

	// Exponential: 100ms + 200ms + 400ms + 800ms = 1500ms backoff
	// Plus base latency: 5 requests × 100ms avg = ~500ms
	// Total expected: ~2000ms, allow generous tolerance for variations
	assertRange(totalTime, 800, 2800, `Exponential backoff timing should show retry delays, got ${totalTime}ms`);
});

suite.test('Exponential capped backoff', async () => {
	const api = createLuminara({
		baseURL: BASE_URL,
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

	// Capped: 200ms + 300ms + 300ms + 300ms + 300ms = 1400ms backoff
	// Plus base latency: 6 requests × 100ms avg = ~600ms
	// Total expected: ~2000ms, allow generous tolerance
	assertRange(totalTime, 1200, 2700, `Capped exponential should show retry delays, got ${totalTime}ms`);
});

suite.test('Fibonacci backoff pattern', async () => {
	const api = createLuminara({
		baseURL: BASE_URL,
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

	// Fibonacci: 50 + 50 + 100 + 150 + 250 + 400 = 1000ms backoff
	// Plus base latency: 7 requests × 100ms avg = ~700ms
	// Total expected: ~1700ms, allow generous tolerance
	assertRange(totalTime, 1000, 2400, `Fibonacci backoff should show retry delays, got ${totalTime}ms`);
});

suite.test('Jitter backoff randomization', async () => {
	const api = createLuminara({
		baseURL: BASE_URL,
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
	
	// Jitter should produce different timings - check variance across multiple runs
	const minTiming = Math.min(...timings);
	const maxTiming = Math.max(...timings);
	const range = maxTiming - minTiming;
	
	// Jitter should produce at least some variance (allow for small variance due to system timing)
	assert(range >= 20, `Jitter should produce some variance in timings, got range: ${range}ms`);
	
	// But all should be within reasonable bounds
	// Base: 200ms + (0-200ms jitter) per retry = 200-400ms per retry
	// Total for 3 retries: 600-1200ms backoff
	// Plus base latency: 4 requests × 100ms avg = ~400ms
	// Total expected: ~1000-1600ms, allow generous tolerance
	timings.forEach(timing => {
		assertRange(timing, 600, 2200, `Jitter timing should be reasonable: ${timing}ms`);
	});
});

suite.test('Exponential jitter combination', async () => {
	const api = createLuminara({
		baseURL: BASE_URL,
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

	// Exponential jitter: 200 + 400 + 800 + 1000(capped) = 2400ms backoff + jitter
	// Jitter can reduce delays significantly, plus base latency varies
	// Plus base latency: 5 requests × 100ms avg = ~500ms
	// Total expected: ~1400-3000ms with jitter variations and latency
	// Allow generous tolerance for jitter randomness and system load
	assertRange(totalTime, 1000, 4200, `Exponential jitter should show retry delays, got ${totalTime}ms`);
});

suite.test('Custom retry handler timing', async () => {
	let retryAttempts = 0;
	
	const api = createLuminara({
		baseURL: BASE_URL,
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

	// Custom: 150ms * 3 = 450ms backoff
	// Plus base latency: 4 requests × 100ms avg = ~400ms
	// Total expected: ~850ms, allow generous tolerance
	assertRange(totalTime, 500, 1400, `Custom retry timing should be ~850ms, got ${totalTime}ms`);
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
		baseURL: BASE_URL,
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
await runTestSuiteIfDirect(import.meta.url, 'Backoff Strategies', suite, mockServer);

export { suite, mockServer };
