/**
 * Error enhancement utilities
 * Adds debugging properties to errors for better developer experience
 */

export function enhanceError(error, requestContext, timeout) {
	const enhancedError = error;
	
	// Add standard error properties if not already present
	if (!enhancedError.hasOwnProperty('status')) {
		enhancedError.status = null;
	}
	if (!enhancedError.hasOwnProperty('statusText')) {
		enhancedError.statusText = null;
	}
	if (!enhancedError.hasOwnProperty('data')) {
		enhancedError.data = null;
	}
	if (!enhancedError.hasOwnProperty('response')) {
		enhancedError.response = null;
	}
	
	// Add comprehensive options for debugging (filtered to avoid circular references)
	enhancedError.options = {
		url: requestContext.url,
		method: requestContext.method,
		headers: { ...requestContext.headers },
		body: requestContext.body ? '[body data]' : undefined,
		timeout,
		retry: requestContext.retry,
		retryDelay: requestContext.retryDelay,
		responseType: requestContext.responseType,
		ignoreResponseError: requestContext.ignoreResponseError,
		parseResponse: requestContext.parseResponse ? '[custom function]' : undefined
	};
	
	return enhancedError;
}

export function createHttpError(response, data, requestContext, timeout) {
	const error = new Error(`${response.status} ${response.statusText}`);
	error.name = 'FetchError';
	error.status = response.status;
	error.statusText = response.statusText;
	error.data = data;
	error.response = response;
	
	return enhanceError(error, requestContext, timeout);
}

export function createTimeoutError(timeout, requestContext) {
	const error = new Error(`Request timeout after ${timeout}ms`);
	error.name = 'TimeoutError';
	
	return enhanceError(error, requestContext, timeout);
}

export function createParseError(originalError, response, requestContext, timeout) {
	const error = originalError;
	error.name = 'ParseError';
	error.status = response.status;
	error.statusText = response.statusText;
	error.response = response;
	
	return enhanceError(error, requestContext, timeout);
}

export function createAbortError(originalError, requestContext, timeout) {
	const error = new Error(typeof originalError === 'string' ? originalError : originalError.message);
	error.name = 'AbortError';
	error.cause = originalError;
	
	return enhanceError(error, requestContext, timeout);
}