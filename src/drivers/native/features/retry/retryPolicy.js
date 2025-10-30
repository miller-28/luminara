/**
 * Advanced retry policies for Luminara
 * Implements intelligent retry logic with status codes, idempotent methods, and Retry-After headers
 */

/**
 * HTTP methods considered idempotent (safe to retry)
 */
export const IDEMPOTENT_METHODS = new Set([
	'GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE', 'TRACE'
]);

/**
 * Default status codes that should trigger retries
 * Based on RFC standards and common practice
 */
export const DEFAULT_RETRY_STATUS_CODES = new Set([
	408, // Request Timeout
	409, // Conflict (can be temporary)
	425, // Too Early
	429, // Too Many Requests
	500, // Internal Server Error
	502, // Bad Gateway
	503, // Service Unavailable
	504  // Gateway Timeout
]);

/**
 * Parse Retry-After header value
 * Supports both seconds (number) and HTTP-date format
 * @param {string} retryAfterValue - The Retry-After header value
 * @returns {number} Delay in milliseconds, or 0 if invalid
 */
export function parseRetryAfter(retryAfterValue) {
	if (!retryAfterValue) {
		return 0;
	}

	// Try parsing as seconds (number)
	const seconds = parseInt(retryAfterValue, 10);
	if (!isNaN(seconds) && seconds > 0) {
		return Math.min(seconds * 1000, 300000); // Cap at 5 minutes
	}

	// Try parsing as HTTP-date
	try {
		const date = new Date(retryAfterValue);
		if (!isNaN(date.getTime())) {
			const delay = date.getTime() - Date.now();
			return Math.max(0, Math.min(delay, 300000)); // Cap at 5 minutes, minimum 0
		}
	} catch (error) {
		// Invalid date format
	}

	return 0;
}

/**
 * Check if an HTTP method is idempotent (safe to retry)
 * @param {string} method - HTTP method
 * @returns {boolean}
 */
export function isIdempotentMethod(method) {
	return IDEMPOTENT_METHODS.has(method?.toUpperCase());
}

/**
 * Default retry policy implementation
 * @param {Error} error - The error that occurred
 * @param {Object} context - Retry context with request info
 * @returns {boolean} Whether to retry the request
 */
export function defaultRetryPolicy(error, context) {
	const { request, attempt, maxAttempts } = context;
	const method = request?.method?.toUpperCase() || 'GET';

	// Don't retry if we've reached max attempts
	if (attempt >= maxAttempts) {
		return false;
	}

	// Always retry network errors for idempotent methods
	if (error.name === 'TypeError' && error.message?.includes('fetch')) {
		return isIdempotentMethod(method);
	}

	// Don't retry timeout errors by default (can be overridden by custom policy)
	if (error.name === 'TimeoutError') {
		return false;
	}

	// Always retry abort errors for idempotent methods (unless user-initiated)
	if (error.name === 'AbortError' && !error.userInitiated) {
		return isIdempotentMethod(method);
	}

	// Check status code based retries
	if (error.status) {
		// For non-idempotent methods, only retry on specific "safe" status codes
		if (!isIdempotentMethod(method)) {
			const safeStatusCodes = new Set([408, 429, 500, 502, 503, 504]);
			return safeStatusCodes.has(error.status);
		}

		// For idempotent methods, retry on all default status codes
		return DEFAULT_RETRY_STATUS_CODES.has(error.status);
	}

	return false;
}

/**
 * Create a retry policy that can be customized
 * @param {Object} options - Retry policy options
 * @param {Set<number>} options.retryStatusCodes - Custom status codes to retry
 * @param {Set<string>} options.idempotentMethods - Custom idempotent methods
 * @param {Function} options.shouldRetry - Custom retry function
 * @returns {Function} Retry policy function
 */
export function createRetryPolicy(options = {}) {
	const {
		retryStatusCodes = DEFAULT_RETRY_STATUS_CODES,
		idempotentMethods = IDEMPOTENT_METHODS,
		shouldRetry
	} = options;

	// If custom shouldRetry function provided, use it
	if (typeof shouldRetry === 'function') {
		return shouldRetry;
	}

	// Return customized default policy
	return (error, context) => {
		const { request, attempt, maxAttempts } = context;
		const method = request?.method?.toUpperCase() || 'GET';

		// Don't retry if we've reached max attempts
		if (attempt >= maxAttempts) {
			return false;
		}

		// Check if method is idempotent
		const isIdempotent = idempotentMethods.has(method);

		// Always retry network errors for idempotent methods
		if (error.name === 'TypeError' && error.message?.includes('fetch')) {
			return isIdempotent;
		}

		// Always retry timeout errors for idempotent methods
		if (error.name === 'TimeoutError') {
			return isIdempotent;
		}

		// Always retry abort errors for idempotent methods (unless user-initiated)
		if (error.name === 'AbortError' && !error.userInitiated) {
			return isIdempotent;
		}

		// Check status code based retries
		if (error.status) {
			// For non-idempotent methods, be more conservative
			if (!isIdempotent) {
				const safeStatusCodes = new Set([408, 429, 500, 502, 503, 504]);
				return safeStatusCodes.has(error.status);
			}

			// For idempotent methods, use configured status codes
			return retryStatusCodes.has(error.status);
		}

		return false;
	};
}

/**
 * Calculate retry delay considering Retry-After header
 * @param {number} baseDelay - Base delay from backoff strategy
 * @param {Response} response - HTTP response (if available)
 * @param {Error} error - Error object (if available)
 * @returns {number} Final delay in milliseconds
 */
export function calculateRetryDelayWithHeaders(baseDelay, response, error) {
	let retryAfterDelay = 0;

	// Check for Retry-After header in response
	if (response?.headers) {
		const retryAfter = response.headers.get('Retry-After');
		if (retryAfter) {
			retryAfterDelay = parseRetryAfter(retryAfter);
		}
	}

	// Check for Retry-After in error context (if error has response data)
	if (!retryAfterDelay && error?.response?.headers) {
		const retryAfter = error.response.headers.get('Retry-After');
		if (retryAfter) {
			retryAfterDelay = parseRetryAfter(retryAfter);
		}
	}

	// Use the longer of the two delays (Retry-After or backoff strategy)
	return Math.max(baseDelay, retryAfterDelay);
}