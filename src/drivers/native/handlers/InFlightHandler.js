/**
 * InFlightHandler - Active request execution coordination (PHASE 2)
 * 
 * Responsibilities:
 * 1. Setup timeout handling
 * 2. Prepare fetch options (method, headers, body)
 * 3. Execute native fetch request
 * 4. Request hedging for latency optimization (future)
 * 
 * This handler manages the request while it's actively being executed.
 */

import { createTimeoutHandler } from '../features/timeout/index.js';
import { timeoutLogger } from '../features/timeout/verboseLogger.js';
import { verboseLog } from '../../../core/verbose/verboseLogger.js';

/**
 * Execute request with timeout handling
 * 
 * @param {object} preparedRequest - Prepared request from RequestDispatcher
 * @param {number} currentAttempt - Current attempt number
 * @returns {Promise<Response>} Fetch Response object
 */
export async function executeRequest(preparedRequest, currentAttempt) {
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
	
	// TODO: Request Hedging - Send multiple redundant requests (FUTURE FEATURE)
	// if (preparedRequest.hedging?.enabled) {
	//   return await executeWithHedging(fullUrl, fetchOptions, preparedRequest);
	// }
	
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

/**
 * Execute request with hedging (FUTURE FEATURE - Placeholder)
 * 
 * Request hedging: Send multiple identical requests to different servers
 * Return first successful response, cancel others
 * 
 * Implementation plan:
 * 1. Start primary request
 * 2. After hedge.delay ms, start hedge request(s) to different servers
 * 3. Use Promise.race() to get first response
 * 4. Cancel remaining requests with AbortController
 * 5. Return winning response
 * 6. Track stats for hedge effectiveness
 */
async function executeWithHedging(url, fetchOptions, preparedRequest) {

	// const { hedging } = preparedRequest;
	// const controllers = [];
	// const requests = [];
	// 
	// // Primary request
	// const primaryController = new AbortController();
	// controllers.push(primaryController);
	// requests.push(fetch(url, { ...fetchOptions, signal: primaryController.signal }));
	// 
	// // Hedge requests after delay
	// setTimeout(() => {
	//   for (let i = 0; i < hedging.maxHedges; i++) {
	//     const hedgeController = new AbortController();
	//     controllers.push(hedgeController);
	//     
	//     const hedgeUrl = hedging.servers?.[i] ? `${hedging.servers[i]}${new URL(url).pathname}` : url;
	//     requests.push(fetch(hedgeUrl, { ...fetchOptions, signal: hedgeController.signal }));
	//   }
	// }, hedging.delay || 100);
	// 
	// // Race and cancel losers
	// const winner = await Promise.race(requests);
	// controllers.forEach(ctrl => ctrl.abort());
	// 
	// return winner;
	
	throw new Error('Request hedging not yet implemented');
}
