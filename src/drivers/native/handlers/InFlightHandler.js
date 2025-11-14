/**
 * InFlightHandler - Active request execution coordination (PHASE 2)
 * 
 * Responsibilities:
 * 1. Setup timeout handling
 * 2. Prepare fetch options (method, headers, body)
 * 3. Execute native fetch request
 * 4. Request hedging for latency optimization
 * 
 * This handler manages the request while it's actively being executed.
 */

import { createTimeoutHandler } from '../features/timeout/index.js';
import { timeoutLogger } from '../features/timeout/verboseLogger.js';
import { verboseLog } from '../../../core/verbose/verboseLogger.js';
import { shouldUseHedging, executeWithHedging } from '../features/hedging/index.js';

/**
 * Execute request with timeout and optional hedging
 * 
 * @param {object} preparedRequest - Prepared request from RequestDispatcher
 * @param {number} currentAttempt - Current attempt number
 * @returns {Promise<Response>} Fetch Response object
 */
export async function executeRequest(preparedRequest, currentAttempt) {
	// Check if hedging should be used
	if (shouldUseHedging(preparedRequest)) {
		return await executeWithHedging(preparedRequest, currentAttempt, executeSingleRequest);
	}
	
	// Standard single request execution
	return await executeSingleRequest(preparedRequest, currentAttempt);
}

/**
 * Execute a single request (used by both hedging and standard flow)
 * 
 * @param {object} preparedRequest - Prepared request from RequestDispatcher
 * @param {number} currentAttempt - Current attempt number
 * @returns {Promise<Response>} Fetch Response object
 */
export async function executeSingleRequest(preparedRequest, currentAttempt) {
	const {
		fullUrl, method, headers, body, signal, timeout, verbose, context
	} = preparedRequest;
	
	// Setup timeout handling with signal combination
	const { signal: combinedSignal, cleanup: timeoutCleanup } =
		createTimeoutHandler(timeout, signal, context);
	
	// Log timeout configuration if verbose
	if (verbose && timeout) {
		timeoutLogger.logTimeoutSetup(context, timeout, 'driver');
	}
	
	// Prepare fetch options
	const fetchOptions = {
		method,
		headers: headers || {},
		signal: combinedSignal
	};
	
	// Handle body for POST/PUT/PATCH requests
	if (body !== undefined && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
		if (typeof body === 'string' || body instanceof URLSearchParams || body instanceof FormData) {
			fetchOptions.body = body;
		} else {
			fetchOptions.body = JSON.stringify(body);
			fetchOptions.headers['Content-Type'] = fetchOptions.headers['Content-Type'] || 'application/json';
		}
	}
	
	// Log request execution start if verbose
	if (verbose) {
		verboseLog(context, 'REQUEST', `Executing native fetch: ${method.toUpperCase()} ${fullUrl}`, {
			method: method.toUpperCase(),
			url: fullUrl,
			hasBody: !!body,
			hasTimeout: !!timeout,
			attempt: currentAttempt
		});
	}
	
	try {
		// Execute native fetch
		const response = await fetch(fullUrl, fetchOptions);
		
		// Clear timeout if request succeeded
		timeoutCleanup();
		
		// Return response with cleanup function and prepared request (include combinedSignal for error handling)
		return {
			response,
			timeoutCleanup,
			preparedRequest: {
				...preparedRequest,
				combinedSignal  // Add combinedSignal for error handler
			}
		};
	} catch (error) {
		// Clear timeout on error
		timeoutCleanup();
		
		// Attach combinedSignal to prepared request for error handler
		preparedRequest.combinedSignal = combinedSignal;
		
		// Re-throw the error to be handled by ErrorResponseHandler
		throw error;
	}
}
