/**
 * Retry logic utilities for drivers
 * Handles retry decision-making and delay calculations
 */

import { createBackoffHandler } from './backoff.js';
import { 
	defaultRetryPolicy, 
	createRetryPolicy, 
	calculateRetryDelayWithHeaders 
} from './retryPolicy.js';
import { getBackoffStrategyInfo } from './verboseLogger.js';

export function shouldRetryRequest(error, context, customRetryPolicy) {

	// Use custom retry policy if provided, otherwise use default
	const retryPolicy = customRetryPolicy || defaultRetryPolicy;

	return retryPolicy(error, context);
}

export async function calculateRetryDelay(attempt, retryDelay, backoffType, backoffMaxDelay, retryContext, response = null, luminaraContext = null) {
	let baseDelay = retryDelay;
	const startTime = Date.now();
	
	// Extract new backoff options from Luminara context
	const backoffDelays = luminaraContext?.req?.backoffDelays;
	const initialDelay = luminaraContext?.req?.initialDelay;
	
	// Handle custom retry delay function
	if (typeof retryDelay === 'function') {

		// Pass the appropriate context to the custom function
		const contextToPass = luminaraContext || retryContext;
		baseDelay = await retryDelay(contextToPass);
	} else if (backoffType) {

		// Use Luminara's backoff strategy
		const backoffHandler = createBackoffHandler(backoffType, retryDelay, backoffMaxDelay, backoffDelays, initialDelay);
		if (backoffHandler) {

			// Pass the Luminara context to the backoff handler if available, otherwise create a minimal one
			const contextForBackoff = luminaraContext || { attempt };
			baseDelay = backoffHandler(contextForBackoff) || retryDelay;
		}
	}

	// Consider Retry-After headers
	const finalDelay = calculateRetryDelayWithHeaders(baseDelay, response, retryContext.error);
	
	return finalDelay;
}

export function createRetryContext(url, method, headers, retry, attempt, response = null, error = null) {
	return {
		request: { url, method, headers },
		options: { retry: retry - (attempt - 1) }, // Remaining retries
		response,
		error,
		attempt,
		maxAttempts: retry + 1
	};
}