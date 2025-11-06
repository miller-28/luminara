import chalk from 'chalk';

// Global console message suppression for test environment
let consoleSuppression = null;

// Global function to suppress redundant console messages during testing
export function enableConsoleSuppressionForTesting() {
	if (consoleSuppression) return; // Already enabled
	
	const originalConsoleWarn = console.warn;
	const originalConsoleError = console.error;
	const originalConsoleLog = console.log;
	const originalProcessStderrWrite = process.stderr.write;
	const originalProcessStdoutWrite = process.stdout.write;
	
	// Messages that are expected during testing but not useful for test output
	const suppressedMessages = [
		'Response body already consumed, cannot parse JSON',
		'Body is unusable',
		'Body has already been consumed',
		'Failed to parse response as JSON',
		// Test debug output patterns
		'🔑 onRequest called with attempt:',
		'🔑 Set authorization header:',
		'🌐 Fetch call',
		'🌐 Fetch returning',
		'💥 onResponseError called with attempt:',
		'onResponse called with context.res:',
		'Final transformedResponse:',
		'[API]' // React simulation debug logs
	];
	
	// Helper function to check if message should be suppressed
	const shouldSuppress = (message) => {
		return suppressedMessages.some(suppressed => message.includes(suppressed));
	};
	
	// Suppress specific console outputs that are expected during error testing
	console.warn = (...args) => {
		const message = args.join(' ');
		if (!shouldSuppress(message)) {
			originalConsoleWarn(...args);
		}
	};
	
	console.error = (...args) => {
		const message = args.join(' ');
		if (!shouldSuppress(message)) {
			originalConsoleError(...args);
		}
	};
	
	console.log = (...args) => {
		const message = args.join(' ');
		if (!shouldSuppress(message)) {
			originalConsoleLog(...args);
		}
	};
	
	// Intercept stderr and stdout writes to catch low-level messages
	process.stderr.write = function(chunk, encoding, callback) {
		const message = chunk.toString();
		if (!shouldSuppress(message)) {
			return originalProcessStderrWrite.call(this, chunk, encoding, callback);
		}
		// Suppress the message by not writing it
		if (typeof callback === 'function') {
			callback();
		}
		return true;
	};
	
	process.stdout.write = function(chunk, encoding, callback) {
		const message = chunk.toString();
		if (!shouldSuppress(message)) {
			return originalProcessStdoutWrite.call(this, chunk, encoding, callback);
		}
		// Suppress the message by not writing it
		if (typeof callback === 'function') {
			callback();
		}
		return true;
	};
	
	consoleSuppression = {
		originalConsoleWarn,
		originalConsoleError,
		originalConsoleLog,
		originalProcessStderrWrite,
		originalProcessStdoutWrite
	};
}

// Function to restore original console methods
export function disableConsoleSuppressionForTesting() {
	if (!consoleSuppression) return; // Not enabled
	
	console.warn = consoleSuppression.originalConsoleWarn;
	console.error = consoleSuppression.originalConsoleError;
	console.log = consoleSuppression.originalConsoleLog;
	process.stderr.write = consoleSuppression.originalProcessStderrWrite;
	process.stdout.write = consoleSuppression.originalProcessStdoutWrite;
	
	consoleSuppression = null;
}

// Test utilities for Luminara testing environment
export class TestSuite {
	constructor(name) {
		this.name = name;
		this.tests = [];
		this.passed = 0;
		this.failed = 0;
		this.startTime = null;
	}

	test(description, testFn) {
		this.tests.push({ description, testFn });
	}

	async run() {
		console.log(chalk.blue.bold(`\n🧪 Running ${this.name}`));
		console.log(chalk.gray('='.repeat(50)));
		
		// Enable console suppression for testing environment
		enableConsoleSuppressionForTesting();
		
		this.startTime = Date.now();
		
		for (const { description, testFn } of this.tests) {
			try {
				const testStart = Date.now();
				await testFn();
				const duration = Date.now() - testStart;
				
				console.log(chalk.green(`  ✅ ${description}`) + chalk.gray(` (${duration}ms)`));
				this.passed++;
			} catch (error) {
				console.log(chalk.red(`  ❌ ${description}`));
				console.log(chalk.red(`     ${error.message}`));
				if (process.env.VERBOSE) {
					console.log(chalk.gray(`     ${error.stack}`));
				}
				this.failed++;
			}
		}
		
		const totalTime = Date.now() - this.startTime;
		const total = this.passed + this.failed;
		
		console.log(chalk.gray('-'.repeat(50)));
		console.log(chalk.cyan(`  📊 ${this.passed}/${total} passed`) + chalk.gray(` (${totalTime}ms)`));
		
		if (this.failed > 0) {
			console.log(chalk.red(`  💥 ${this.failed} failed`));
		}
		
		// Disable console suppression after tests complete
		disableConsoleSuppressionForTesting();
		
		return { passed: this.passed, failed: this.failed, total };
	}
}

export class MockServer {

	constructor(port = 4200) {
		this.port = port;
		this.server = null;
		this.requestCounts = new Map();
	}

	async start() {
		const { createServer } = await import('http');
		
		this.server = createServer((req, res) => {
			// CORS headers
			res.setHeader('Access-Control-Allow-Origin', '*');
			res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
			res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Custom-Header');
			
			if (req.method === 'OPTIONS') {
				res.writeHead(200);
				res.end();
				return;
			}
			
			const url = new URL(req.url, `http://localhost:${this.port}`);
			const path = url.pathname;
			
			// Track request counts
			const countKey = `${req.method}:${path}`;
			this.requestCounts.set(countKey, (this.requestCounts.get(countKey) || 0) + 1);
			
			this.handleRequest(req, res, path, url.searchParams);
		});
		
		return new Promise((resolve) => {
			this.server.listen(this.port, () => {
				console.log(chalk.yellow(`🔧 Mock server started on port ${this.port}`));
				resolve();
			});
		});
	}

	handleRequest(req, res, path, params) {
		// Delay simulation
		const delay = parseInt(params.get('delay') || '0');
		const shouldFail = params.get('fail') === 'true';
		const status = parseInt(params.get('status') || '200');
		
		setTimeout(() => {
			if (shouldFail || status >= 400) {
				res.writeHead(status, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify({ 
					error: 'Simulated error',
					status,
					path,
					method: req.method 
				}));
				return;
			}
			
			// Success responses
			switch (path) {
				case '/json':
					res.writeHead(200, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify({ 
						message: 'Success',
						method: req.method,
						timestamp: new Date().toISOString(),
						requestCount: this.requestCounts.get(`${req.method}:${path}`)
					}));
					break;
					
				case '/text':
					if (req.method === 'POST') {
						res.writeHead(200, { 'Content-Type': 'application/json' });
						let textBody = '';
						req.on('data', chunk => textBody += chunk);
						req.on('end', () => {
							res.end(JSON.stringify({ 
								message: 'Text received',
								body: textBody.toString(),
								method: req.method
							}));
						});
						return;
					} else {
						res.writeHead(200, { 'Content-Type': 'text/plain' });
						res.end(`Success: ${req.method} request to ${path}`);
					}
					break;
					
				case '/form':
					res.writeHead(200, { 'Content-Type': 'application/json' });
					let body = '';
					req.on('data', chunk => body += chunk);
					req.on('end', () => {
						res.end(JSON.stringify({ 
							message: 'Form received',
							body: body.toString(),
							method: req.method
						}));
					});
					return; // Important: return here to avoid the rest of the switch
				
				// Error testing endpoints
				case '/error-json':
					res.writeHead(400, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify({ 
						error: 'Bad Request',
						message: 'Validation failed',
						code: 'VALIDATION_ERROR',
						details: {
							field: 'test',
							reason: 'Invalid data provided'
						}
					}));
					break;
					
				case '/error-500':
					res.writeHead(500, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify({ 
						error: 'Internal Server Error',
						message: 'Something went wrong on the server',
						code: 'INTERNAL_ERROR'
					}));
					break;
					
				case '/invalid-json':
					res.writeHead(200, { 'Content-Type': 'application/json' });
					res.end('{ invalid json content }'); // Malformed JSON
					break;
					
				case '/validation-error':
					res.writeHead(422, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify({ 
						error: 'Unprocessable Entity',
						message: 'Validation errors occurred',
						code: 'VALIDATION_FAILED',
						validation_errors: [
							{ field: 'email', message: 'Invalid email format' },
							{ field: 'password', message: 'Password too short' }
						]
					}));
					break;
					
				case '/prefix-json':
					res.writeHead(200, { 'Content-Type': 'application/json' });
					res.end(')]}\',' + JSON.stringify({ 
						message: 'Hello from API',
						data: 'This has a JSONP security prefix'
					}));
					break;
					
				case '/xml':
					res.writeHead(200, { 'Content-Type': 'text/xml' });
					res.end('<?xml version="1.0"?><root><message>Hello XML</message><data>Sample XML content</data></root>');
					break;
					
				case '/html':
					res.writeHead(200, { 'Content-Type': 'text/html' });
					res.end('<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Hello HTML</h1></body></html>');
					break;
					
				case '/blob':
					res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
					res.end(Buffer.from('Binary blob content'));
					break;
					
				case '/arraybuffer':
					res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
					res.end(Buffer.from('ArrayBuffer content'));
					break;
					
				case '/ndjson':
					res.writeHead(200, { 'Content-Type': 'application/x-ndjson' });
					res.end('{"line": 1, "data": "first"}\n{"line": 2, "data": "second"}\n{"line": 3, "data": "third"}');
					break;
					
				case '/multipart':
					res.writeHead(200, { 'Content-Type': 'application/json' });
					let multipartBody = '';
					req.on('data', chunk => multipartBody += chunk);
					req.on('end', () => {
						res.end(JSON.stringify({ 
							message: 'Multipart received',
							bodyLength: multipartBody.length,
							method: req.method
						}));
					});
					return;
					
				case '/soap':
					res.writeHead(200, { 'Content-Type': 'application/json' });
					let soapBody = '';
					req.on('data', chunk => soapBody += chunk);
					req.on('end', () => {
						res.end(JSON.stringify({ 
							message: 'SOAP received',
							soapAction: req.headers['soapaction'] || req.headers['content-type'],
							method: req.method,
							bodyLength: soapBody.length
						}));
					});
					return;
					
				// New endpoints for comprehensive interceptor testing
				case '/echo-headers':
					res.writeHead(200, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify({ 
						message: 'Headers echoed',
						headers: req.headers,
						method: req.method,
						path
					}));
					break;
					
				// Error endpoints with specific status codes
				case '/error/400':
					res.writeHead(400, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify({ 
						error: 'Bad Request',
						status: 400,
						path,
						method: req.method 
					}));
					break;
					
				case '/error/404':
					res.writeHead(404, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify({ 
						error: 'Not Found',
						status: 404,
						path,
						method: req.method 
					}));
					break;
					
				case '/error/500':
					res.writeHead(500, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify({ 
						error: 'Internal Server Error',
						status: 500,
						path,
						method: req.method 
					}));
					break;
					
				// Error-then-success endpoint for retry testing
				default:
					if (path.startsWith('/error-then-success/')) {
						const failureCount = parseInt(path.split('/')[2]) || 0;
						const requestCount = this.requestCounts.get(`${req.method}:${path}`) || 0;
						
						if (requestCount <= failureCount) {
							res.writeHead(500, { 'Content-Type': 'application/json' });
							res.end(JSON.stringify({ 
								error: 'Temporary failure',
								attempt: requestCount,
								willSucceedAfter: failureCount
							}));
						} else {
							res.writeHead(200, { 'Content-Type': 'application/json' });
							res.end(JSON.stringify({ 
								message: 'Success after retries',
								attempt: requestCount,
								method: req.method
							}));
						}
						break;
					}
					
					res.writeHead(200, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify({ 
						message: 'Default response',
						path,
						method: req.method
					}));
			}
		}, delay);
	}

	getRequestCount(method, path) {
		return this.requestCounts.get(`${method}:${path}`) || 0;
	}

	resetCounts() {
		this.requestCounts.clear();
	}

	async stop() {
		if (this.server) {
			return new Promise((resolve) => {
				this.server.close(() => {
					console.log(chalk.yellow('🔧 Mock server stopped'));
					resolve();
				});
			});
		}
	}
}

export function assert(condition, message) {
	if (!condition) {
		throw new Error(message);
	}
}

export function assertEqual(actual, expected, message) {
	// Handle array comparison
	if (Array.isArray(actual) && Array.isArray(expected)) {
		if (actual.length !== expected.length) {
			throw new Error(message || `Expected array length ${expected.length}, got ${actual.length}`);
		}
		for (let i = 0; i < actual.length; i++) {
			if (actual[i] !== expected[i]) {
				throw new Error(message || `Expected array[${i}] to be ${expected[i]}, got ${actual[i]}`);
			}
		}
		return;
	}
	
	// Handle primitive comparison
	if (actual !== expected) {
		throw new Error(message || `Expected ${expected}, got ${actual}`);
	}
}

export function assertRange(value, min, max, message) {
	if (value < min || value > max) {
		throw new Error(message || `Expected ${value} to be between ${min} and ${max}`);
	}
}

export async function measureTime(fn) {
	const start = Date.now();
	const result = await fn();
	const duration = Date.now() - start;
	return { result, duration };
}

export function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export class Timer {
	constructor() {
		this.times = [];
	}

	mark() {
		this.times.push(Date.now());
	}

	getDuration(from = 0, to = -1) {
		const startTime = this.times[from];
		const endTime = to === -1 ? this.times[this.times.length - 1] : this.times[to];
		return endTime - startTime;
	}

	getDurations() {
		const durations = [];
		for (let i = 1; i < this.times.length; i++) {
			durations.push(this.times[i] - this.times[i - 1]);
		}
		return durations;
	}

	reset() {
		this.times = [];
	}
}