/**
 * ErrorResponseHandler - Error path response processing
 * 
 * Responsibilities:
 * 1. Classify error type (Abort, Timeout, Network, etc.)
 * 2. Transform errors into LuminaraError format
 * 3. Enrich errors with request context
 * 
 * This is the error path when a request throws an exception.
 */

import { createLuminaraError, createTimeoutError, createAbortError, createNetworkError } from '../features/error/index.js';
import { errorLogger } from '../features/error/verboseLogger.js';

/**
 * Handle error response
 * 
 * @param {Error} error - Error thrown during request
 * @param {object} preparedRequest - Prepared request configuration
 * @param {number} currentAttempt - Current attempt number
 * @returns {Error} Transformed LuminaraError
 */
export async function handleErrorResponse(error, preparedRequest, currentAttempt) {
	const { fullUrl, method, headers, body, timeout, retry, retryDelay, responseType, ignoreResponseError, parseResponse, verbose, context, combinedSignal } = preparedRequest;
	
	// Create request context for error
	const requestContext = {
		url: fullUrl,
		method,
		headers: headers || {},
		body,
		timeout,
		retry,
		retryDelay,
		responseType,
		ignoreResponseError,
		parseResponse
	};
	
	// Log error caught in driver if verbose
	if (verbose) {
		errorLogger.logErrorCaught(context, error, 'native-driver');
	}
	
	// Handle AbortError specifically
	if (error.name === 'AbortError') {

		// Check if this was a timeout abort
		if (combinedSignal && combinedSignal.aborted && timeout !== undefined) {
			if (verbose) {
				errorLogger.logTimeoutError(context, error, timeout);
				errorLogger.logErrorTransformation(context, error, { name: 'TimeoutError' }, 'abort-to-timeout');
			}

			return createTimeoutError(timeout, requestContext, currentAttempt);
		}
		
		// Otherwise it's a user-initiated abort
		if (verbose) {
			errorLogger.logAbortError(context, error, 'user');
			errorLogger.logErrorTransformation(context, error, { name: 'AbortError' }, 'abort-signal');
		}

		return createAbortError(error, requestContext, currentAttempt);
	}
	
	// Handle string abort reasons (convert to proper Error objects)
	if (typeof error === 'string') {
		if (verbose) {
			errorLogger.logErrorTransformation(context, { name: 'String', message: error }, { name: 'AbortError' }, 'string-to-abort');
		}

		return createAbortError(error, requestContext, currentAttempt);
	}
	
	// Handle TypeError (usually network errors)
	if (error.name === 'TypeError') {
		if (verbose) {
			errorLogger.logNetworkError(context, error);
			errorLogger.logErrorTransformation(context, error, { name: 'NetworkError' }, 'type-error-to-network');
		}

		return createNetworkError(error, requestContext, currentAttempt);
	}
	
	// If this is already a LuminaraError, just re-throw
	if (error.name === 'LuminaraError') {
		return error;
	}
	
	// For any other error, create a generic LuminaraError
	if (verbose) {
		errorLogger.logErrorTransformation(context, error, { name: 'LuminaraError' }, 'generic-error');
	}

	return createLuminaraError(error.message, {
		request: requestContext,
		attempt: currentAttempt,
		originalError: error
	});
}
