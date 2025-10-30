/**
 * Retry logic utilities for drivers
 * Handles retry decision-making and delay calculations
 */

import { createBackoffHandler } from "./backoff.js";
import { 
	defaultRetryPolicy, 
	createRetryPolicy, 
	calculateRetryDelayWithHeaders 
} from "./retryPolicy.js";

export function shouldRetryRequest(error, context, customRetryPolicy) {
	// Use custom retry policy if provided, otherwise use default
	const retryPolicy = customRetryPolicy || defaultRetryPolicy;
	return retryPolicy(error, context);
}

export async function calculateRetryDelay(attempt, retryDelay, backoffType, backoffMaxDelay, retryContext, response = null) {
	let baseDelay = retryDelay;
	
	// Handle custom retry delay function
	if (typeof retryDelay === 'function') {
		baseDelay = await retryDelay(retryContext);
	} else if (backoffType) {
		// Use Luminara's backoff strategy
		const backoffHandler = createBackoffHandler(backoffType, retryDelay, backoffMaxDelay);
		if (backoffHandler) {
			baseDelay = backoffHandler(retryContext) || retryDelay;
		}
	}

	// Consider Retry-After headers
	const finalDelay = calculateRetryDelayWithHeaders(baseDelay, response, retryContext.error);
	
	return finalDelay;
}export function createRetryContext(url, method, headers, retry, attempt, response = null, error = null) {
	return {
		request: { url, method, headers },
		options: { retry: retry - (attempt - 1) }, // Match ofetch behavior: remaining retries
		response,
		error,
		attempt,
		maxAttempts: retry + 1
	};
}