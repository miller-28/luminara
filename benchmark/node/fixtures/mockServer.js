import http from 'http';

/**
 * Lightweight HTTP mock server for benchmarking
 * Zero latency, configurable responses
 */
export class MockServer {
	constructor(config = {}) {
		this.port = config.port || 9999;
		this.latency = config.latency || 0;
		this.responses = config.responses || {};
		this.server = null;
		this.requestCount = 0;
	}
	
	async start() {
		return new Promise((resolve, reject) => {
			this.server = http.createServer((req, res) => {
				this.requestCount++;
				
				const url = req.url;
				const response = this.responses[url];
				
				const sendResponse = () => {
					if (!response) {
						res.writeHead(404, { 'Content-Type': 'application/json' });
						res.end(JSON.stringify({ error: 'Not found' }));
						return;
					}
					
					if (typeof response === 'string') {
						res.writeHead(200, { 'Content-Type': 'text/plain' });
						res.end(response);
					} else if (Buffer.isBuffer(response)) {
						res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
						res.end(response);
					} else {
						res.writeHead(200, { 'Content-Type': 'application/json' });
						res.end(JSON.stringify(response));
					}
				};
				
				if (this.latency > 0) {
					setTimeout(sendResponse, this.latency);
				} else {
					sendResponse();
				}
			});
			
			this.server.on('error', reject);
			this.server.listen(this.port, () => {
				resolve();
			});
		});
	}
	
	async close() {
		if (this.server) {
			return new Promise((resolve) => {
				this.server.close(() => {
					this.server = null;
					resolve();
				});
			});
		}
	}
	
	getRequestCount() {
		return this.requestCount;
	}
	
	resetRequestCount() {
		this.requestCount = 0;
	}
}

/**
 * Generate test data payloads
 */
export function generateTestData(size) {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < size; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

export function generateJsonPayload(size) {
	const data = generateTestData(size);
	return {
		message: 'success',
		data: data,
		timestamp: Date.now()
	};
}

export function generateBlobPayload(size) {
	return Buffer.alloc(size, 'x');
}
