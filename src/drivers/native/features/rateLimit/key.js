/**
 * Rate Limiting Key Derivation System
 * 
 * Derives rate limiting keys based on scope and include/exclude patterns.
 * Supports global, domain, and endpoint-based rate limiting with pattern matching.
 */

/**
 * Parse URL string manually to avoid browser "Illegal invocation" errors
 * @param {string} urlString - Full URL string to parse
 * @returns {Object} URL-like object with hostname, pathname, origin properties
 */
function parseUrlString(urlString) {

	// Parse URL manually using regex to avoid browser issues
	const urlPattern = /^(https?):\/\/([^\/]+)(\/.*)?$/;
	const match = urlString.match(urlPattern);
	
	if (match) {
		const [, protocol, hostname, pathname = '/'] = match;

		return {
			protocol: protocol + ':',
			hostname,
			pathname,
			origin: `${protocol}://${hostname}`
		};
	} else {

		// Fallback for malformed URLs
		return {
			protocol: 'http:',
			hostname: 'localhost',
			pathname: '/',
			origin: 'http://localhost'
		};
	}
}

/**
 * Derive rate limiting key from request based on scope and patterns
 * @param {Object} req - Request object with url property
 * @param {string} scope - Rate limiting scope: 'global', 'domain', or 'endpoint'
 * @param {Object} options - Include/exclude pattern options
 * @returns {string} Rate limiting key for bucketing requests
 */
export function deriveKey(req, scope = 'global', { include, exclude } = {}) {

	// Parse request URL using string parsing to avoid browser "Illegal invocation" errors
	let url;
	
	try {
		const requestUrl = req.url || '/';
		
		// Build URL info using string parsing (browser-safe approach)
		if (typeof requestUrl === 'string' && (requestUrl.startsWith('http://') || requestUrl.startsWith('https://'))) {

			// Full URL - parse manually
			url = parseUrlString(requestUrl);
		} else {

			// Relative URL - combine with base
			const base = req.baseURL || req.baseUrl;
			
			if (base) {

				// Combine base and relative URL manually
				const fullUrl = base.endsWith('/') ? base + requestUrl.replace(/^\//, '') : base + '/' + requestUrl.replace(/^\//, '');
				url = parseUrlString(fullUrl);
			} else if (typeof window !== 'undefined' && window.location) {

				// Browser environment - use window.location
				const fullUrl = window.location.origin + (requestUrl.startsWith('/') ? requestUrl : '/' + requestUrl);
				url = parseUrlString(fullUrl);
			} else {

				// Node.js environment fallback
				url = parseUrlString('http://localhost' + (requestUrl.startsWith('/') ? requestUrl : '/' + requestUrl));
			}
		}
	} catch (error) {

		// Fallback for any parsing errors
		console.warn('Rate limiting: Failed to parse URL', req.url, error);
		const urlString = req.url || '/';
		const pathOnly = urlString.split('?')[0];
		url = {
			pathname: pathOnly,
			hostname: 'localhost',
			origin: 'http://localhost'
		};
	}
	
	// Check include/exclude patterns first (applies to all scopes)
	const path = url.pathname;
	if (include || exclude) {
		const shouldInclude = include ? matchesPatterns(path, include) : true;
		const shouldExclude = exclude ? matchesPatterns(path, exclude) : false;
		
		// Debug logging for pattern matching
		if (req.debugRateLimit) {
			console.log(`[DEBUG] Path: ${path}, shouldInclude: ${shouldInclude}, shouldExclude: ${shouldExclude}`);
			if (include) {
				console.log(`[DEBUG] Include patterns: ${JSON.stringify(include)}`);
			}
			if (exclude) {
				console.log(`[DEBUG] Exclude patterns: ${JSON.stringify(exclude)}`);
			}
		}
		
		// If doesn't match include pattern or matches exclude pattern, bypass rate limiting
		if (!shouldInclude || shouldExclude) {
			if (req.debugRateLimit) {
				console.log(`[DEBUG] Returning __no_limit__ for path: ${path}`);
			}

			return '__no_limit__';
		}
	}
	
	// Global scope - all requests share same bucket (that pass include/exclude)
	if (scope === 'global') {
		const key = '__global__';
		if (req.debugRateLimit) {
			console.log(`[DEBUG] Returning global key: ${key} for path: ${path}`);
		}

		return key;
	}
	
	// Domain scope - bucket by hostname
	if (scope === 'domain') {
		return url.hostname;
	}
	
	// Endpoint scope - bucket by origin + pathname
	if (scope === 'endpoint') {
		return `${url.origin}${url.pathname}`;
	}
	
	// Unknown scope fallback
	return '__unknown_scope__';
}

/**
 * Check if a string matches any of the provided patterns
 * @param {string} str - String to test
 * @param {Array} patterns - Array of strings or RegExp patterns
 * @returns {boolean} True if string matches any pattern
 */
function matchesPatterns(str, patterns) {
	if (!Array.isArray(patterns)) {
		return false;
	}
	
	return patterns.some(pattern => {
		if (pattern instanceof RegExp) {
			return pattern.test(str);
		}
		
		if (typeof pattern === 'string') {

			// Support simple wildcard patterns
			if (pattern.includes('*')) {

				// Convert wildcard pattern to regex
				const regexPattern = pattern
					.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape special chars
					.replace(/\\\*/g, '.*'); // Convert * to .*

				return new RegExp(`^${regexPattern}$`).test(str);
			}
			
			// Exact string match
			return str === pattern;
		}
		
		return false;
	});
}

/**
 * Validate scope value
 * @param {string} scope - Scope to validate
 * @returns {boolean} True if scope is valid
 */
export function isValidScope(scope) {
	return ['global', 'domain', 'endpoint'].includes(scope);
}

/**
 * Extract domain from URL string
 * @param {string} url - URL string
 * @returns {string|null} Domain or null if invalid
 */
export function extractDomain(url) {
	try {
		const parsed = parseUrlString(url);

		return parsed.hostname;
	} catch (error) {
		return null;
	}
}

/**
 * Extract endpoint (origin + pathname) from URL string
 * @param {string} url - URL string
 * @returns {string|null} Endpoint or null if invalid
 */
export function extractEndpoint(url) {
	try {
		const parsed = parseUrlString(url);

		return `${parsed.origin}${parsed.pathname}`;
	} catch (error) {
		return null;
	}
}

/**
 * Test pattern matching (useful for debugging)
 * @param {string} str - String to test
 * @param {Array} patterns - Patterns to test against
 * @returns {Object} Object with match results for each pattern
 */
export function testPatterns(str, patterns) {
	if (!Array.isArray(patterns)) {
		return {};
	}
	
	const results = {};
	
	patterns.forEach((pattern, index) => {
		const key = pattern instanceof RegExp ? pattern.toString() : pattern;
		
		if (pattern instanceof RegExp) {
			results[key] = pattern.test(str);
		} else if (typeof pattern === 'string') {
			if (pattern.includes('*')) {
				const regexPattern = pattern
					.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
					.replace(/\\\*/g, '.*');
				results[key] = new RegExp(`^${regexPattern}$`).test(str);
			} else {
				results[key] = str === pattern;
			}
		} else {
			results[key] = false;
		}
	});
	
	return results;
}