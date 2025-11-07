/**
 * LuminaraError - Consistent error normalization
 * Provides a standardized error interface with comprehensive debugging information
 */

/**
 * Creates a normalized LuminaraError with consistent interface
 * @param {string} message - Error message
 * @param {Object} options - Error options
 * @returns {LuminaraError} Normalized error object
 */
export function createLuminaraError(message, {
	status = undefined,
	code = undefined,
	data = undefined,
	request = {},
	response = null,
	attempt = 1,
	originalError = null
} = {}) {
	const error = new Error(message);
	error.name = 'LuminaraError';
	error.status = status;
	error.code = code;
	error.data = data;
	error.request = request;
	error.response = response;
	error.attempt = attempt;
	
	// Preserve original error for debugging
	if (originalError) {
		error.cause = originalError;
	}
	
	return error;
}

/**
 * Attempts to parse response data as JSON safely
 * @param {Response} response - Fetch Response object
 * @returns {Promise<any>} Parsed JSON data or undefined
 */
async function safeParseJson(response) {
	try {
		if (!response || !response.body) {
			return undefined;
		}
		
		const contentType = response.headers.get('content-type') || '';
		if (!contentType.includes('application/json')) {
			return undefined;
		}
		
		// Check if body is already consumed
		if (response.bodyUsed) {
			console.debug('Response body already consumed, cannot parse JSON');

			return undefined;
		}
		
		// Clone the response to avoid consuming the original body
		const clonedResponse = response.clone();

		return await clonedResponse.json();
	} catch (error) {

		// Failed to parse JSON, return undefined
		console.debug('Failed to parse error response as JSON:', error.message);

		return undefined;
	}
}

/**
 * Creates a minimal response snapshot for debugging
 * @param {Response} response - Fetch Response object
 * @returns {Object} Response snapshot
 */
function createResponseSnapshot(response) {
	if (!response) {
		return null;
	}
	
	return {
		status: response.status,
		statusText: response.statusText,
		headers: response.headers, // Keep as Headers object for compatibility
		url: response.url,
		redirected: response.redirected,
		type: response.type
	};
}

/**
 * Creates a shaped request config for debugging
 * @param {Object} requestContext - Original request context
 * @returns {Object} Shaped request config
 */
function createRequestSnapshot(requestContext) {
	return {
		url: requestContext.url,
		method: requestContext.method || 'GET',
		headers: { ...(requestContext.headers || {}) },
		body: requestContext.body ? '[body data]' : undefined,
		timeout: requestContext.timeout,
		retry: requestContext.retry,
		retryDelay: requestContext.retryDelay,
		responseType: requestContext.responseType
	};
}

/**
 * Enhanced HTTP error with JSON data parsing
 * @param {Response} response - Fetch Response object
 * @param {Object} requestContext - Request context
 * @param {number} attempt - Current retry attempt
 * @returns {Promise<LuminaraError>} Normalized HTTP error
 */
export async function createHttpError(response, requestContext, attempt = 1) {

	// Try to parse JSON error data from server
	const errorData = await safeParseJson(response);
	
	// Create meaningful error message
	const message = errorData?.message || 
		errorData?.error || 
		`HTTP ${response.status}: ${response.statusText}`;
	
	return createLuminaraError(message, {
		status: response.status,
		code: errorData?.code || response.statusText,
		data: errorData,
		request: createRequestSnapshot(requestContext),
		response: createResponseSnapshot(response),
		attempt
	});
}

/**
 * Creates a timeout error
 * @param {number} timeout - Timeout duration in milliseconds
 * @param {Object} requestContext - Request context
 * @param {number} attempt - Current retry attempt
 * @returns {LuminaraError} Normalized timeout error
 */
export function createTimeoutError(timeout, requestContext, attempt = 1) {
	return createLuminaraError(`Request timeout after ${timeout}ms`, {
		code: 'TIMEOUT',
		request: createRequestSnapshot(requestContext),
		attempt
	});
}

/**
 * Creates a parse error
 * @param {Error} originalError - Original parsing error
 * @param {Response} response - Fetch Response object
 * @param {Object} requestContext - Request context
 * @param {number} attempt - Current retry attempt
 * @returns {LuminaraError} Normalized parse error
 */
export function createParseError(originalError, response, requestContext, attempt = 1) {
	return createLuminaraError(`Failed to parse response: ${originalError.message}`, {
		status: response?.status,
		code: 'PARSE_ERROR',
		request: createRequestSnapshot(requestContext),
		response: createResponseSnapshot(response),
		attempt,
		originalError
	});
}

/**
 * Creates an abort error
 * @param {Error|string} originalError - Original abort error
 * @param {Object} requestContext - Request context
 * @param {number} attempt - Current retry attempt
 * @returns {LuminaraError} Normalized abort error
 */
export function createAbortError(originalError, requestContext, attempt = 1) {
	const message = typeof originalError === 'string' ? originalError : originalError.message;
	
	return createLuminaraError(`Request aborted: ${message}`, {
		code: 'ABORT',
		request: createRequestSnapshot(requestContext),
		attempt,
		originalError: typeof originalError === 'string' ? null : originalError
	});
}

/**
 * Creates a network error
 * @param {Error} originalError - Original network error
 * @param {Object} requestContext - Request context
 * @param {number} attempt - Current retry attempt
 * @returns {LuminaraError} Normalized network error
 */
export function createNetworkError(originalError, requestContext, attempt = 1) {
	return createLuminaraError(`Network error: ${originalError.message}`, {
		code: 'NETWORK_ERROR',
		request: createRequestSnapshot(requestContext),
		attempt,
		originalError
	});
}