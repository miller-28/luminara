/**
 * Key Generator for Debouncer
 * Generates unique keys for requests based on different strategies
 */

/**
 * Generate unique key for request based on strategy
 * @param {Object} options - Request options
 * @param {string|function} strategy - 'url', 'method+url', 'method+url+body', or custom function
 * @returns {string} - Unique key for the request
 */
export function generateKey(options, strategy = 'url') {
	// Custom function strategy
	if (typeof strategy === 'function') {
		return strategy(options);
	}
	
	// Use fullUrl if available, fallback to url
	const url = options.fullUrl || options.url;
	
	// Predefined strategies
	switch (strategy) {
		case 'url':
			return url;
		
		case 'method+url':
			return `${options.method}:${url}`;
		
		case 'method+url+body':
			const bodyHash = options.body ? JSON.stringify(options.body) : '';
			return `${options.method}:${url}:${bodyHash}`;
		
		default:
			// Fallback to URL strategy
			return url;
	}
}
