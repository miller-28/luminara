/**
 * SuccessResponseHandler - Success path response processing (PHASE 3)
 * 
 * Responsibilities:
 * 1. Parse response data based on responseType
 * 2. Check HTTP status code
 * 3. Return formatted response object
 * 
 * This is the success path after a request completes without throwing.
 */

import { parseResponseData } from '../features/response/index.js';
import { responseLogger } from '../features/response/verboseLogger.js';
import { createHttpError, createParseError } from '../features/error/index.js';
import { errorLogger } from '../features/error/verboseLogger.js';

/**
 * Handle successful response
 * 
 * @param {object} result - Result from executeRequest { response, timeoutCleanup, preparedRequest }
 * @param {object} preparedRequest - Prepared request configuration
 * @param {number} currentAttempt - Current attempt number
 * @returns {Promise<object>} Formatted response { status, headers, data }
 */
export async function handleSuccessResponse(result, preparedRequest, currentAttempt) {
	const { response } = result;
	const { responseType, parseResponse, ignoreResponseError, verbose, context } = preparedRequest;
	
	// Log response received if verbose
	if (verbose) {
		responseLogger.logResponseReceived(context, response, 'unknown');
		responseLogger.logResponseHeaders(context, response.headers, ['content-type', 'content-length', 'cache-control']);
	}
	
	// Parse response data based on parseResponse and responseType options
	let data;
	try {
		data = await parseResponseData(response, responseType, parseResponse, context);
		
		// Log successful parsing if verbose
		if (verbose) {
			responseLogger.logResponseParsingSuccess(context, responseType || 'auto', typeof data, JSON.stringify(data).length);
		}
	} catch (parseError) {

		// Log parsing error if verbose
		if (verbose) {
			responseLogger.logResponseParsingError(context, responseType || 'auto', parseError, 'error');
		}
		
		// Create request context for error
		const requestContext = createRequestContext(preparedRequest, response);
		throw await createParseError(parseError, response, requestContext, currentAttempt);
	}
	
	// For non-2xx responses, check ignoreResponseError option
	if (!response.ok && !ignoreResponseError) {

		// Log HTTP error if verbose
		if (verbose) {
			errorLogger.logHttpError(context, response, { status: response.status, data });
		}
		
		// Create request context for error
		const requestContext = createRequestContext(preparedRequest, response);
		throw await createHttpError(response, requestContext, currentAttempt, data);
	}
	
	return {
		status: response.status,
		headers: response.headers,
		data
	};
}

/**
 * Create request context for error reporting
 */
function createRequestContext(preparedRequest, response) {
	const { fullUrl, method, headers, body, timeout, retry, retryDelay, responseType, ignoreResponseError, parseResponse } = preparedRequest;
	
	return {
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
}
