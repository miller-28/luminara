import chalk from 'chalk';

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
		
		return { passed: this.passed, failed: this.failed, total };
	}
}

export class MockServer {
	constructor(port = 3001) {
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
					res.writeHead(200, { 'Content-Type': 'text/plain' });
					res.end(`Success: ${req.method} request to ${path}`);
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
					break;
					
				default:
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