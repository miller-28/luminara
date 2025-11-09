/**
 * KeyGenerator - Generate unique keys for request identity
 * Supports multiple strategies: url, url+method, url+method+body, custom
 */

/**
 * Generate request key based on strategy
 */
export function generateKey(request, strategy, options = {}) {
	switch (strategy) {
		case 'url':
			return generateUrlKey(request);

		case 'url+method':
			return generateMethodUrlKey(request);

		case 'url+method+body':
			return generateFullKey(request, options);

		case 'custom':
			if (typeof options.keyGenerator !== 'function') {
				throw new Error('keyStrategy "custom" requires a keyGenerator function');
			}
			const customKey = options.keyGenerator(request);
			if (typeof customKey !== 'string') {
				throw new Error(`keyGenerator must return a string, got ${typeof customKey}`);
			}
			return customKey;

		default:
			throw new Error(`Invalid keyStrategy: "${strategy}". Must be one of: url, url+method, url+method+body, custom`);
	}
}

/**
 * Strategy: url only
 */
function generateUrlKey(request) {
	return request.fullUrl || request.url;
}

/**
 * Strategy: url + method
 */
function generateMethodUrlKey(request) {
	const url = request.fullUrl || request.url;
	const method = request.method || 'GET';
	return `${method}:${url}`;
}

/**
 * Strategy: url + method + body + headers
 */
function generateFullKey(request, options) {
	const url = request.fullUrl || request.url;
	const method = request.method || 'GET';
	let key = `${method}:${url}`;

	// Add body hash
	if (request.body) {
		const bodyHash = hashBody(request.body);
		key += `:body:${bodyHash}`;
	}

	// Add selected headers
	if (options.includeHeaders && options.includeHeaders.length > 0) {
		const headers = request.headers || {};
		const headerParts = [];

		for (const headerName of options.includeHeaders) {
			const headerValue = headers[headerName] || headers[headerName.toLowerCase()];
			if (headerValue) {
				headerParts.push(`${headerName}=${headerValue}`);
			}
		}

		if (headerParts.length > 0) {
			key += `:headers:${headerParts.join(',')}`;
		}
	}

	return key;
}

/**
 * Hash request body to fixed-size string
 * Handles different body types: string, object, FormData, etc.
 */
function hashBody(body) {
	let bodyString;

	if (typeof body === 'string') {
		bodyString = body;
	} else if (body instanceof FormData) {
		// FormData - convert to string representation
		const parts = [];
		for (const [key, value] of body.entries()) {
			parts.push(`${key}=${value}`);
		}
		bodyString = parts.join('&');
	} else if (body instanceof URLSearchParams) {
		bodyString = body.toString();
	} else if (typeof body === 'object' && body !== null) {
		try {
			bodyString = JSON.stringify(body);
		} catch (error) {
			bodyString = String(body);
		}
	} else {
		bodyString = String(body);
	}

	// Simple hash function (djb2 algorithm)
	let hash = 5381;
	for (let i = 0; i < bodyString.length; i++) {
		hash = ((hash << 5) + hash) + bodyString.charCodeAt(i);
		hash = hash & hash; // Convert to 32-bit integer
	}

	return Math.abs(hash).toString(36);
}
