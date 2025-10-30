/**
 * Retry logic utilities for drivers
 * Handles retry decision-making and delay calculations
 */

import { createBackoffHandler } from "../../../core/backoff.js";

export function shouldRetryRequest(error, retryStatusCodes) {
	// Retry on network errors
	if (error.name === 'TypeError' && error.message.includes('fetch')) {
		return true;
	}
	
	// Retry on specific status codes
	if (error.status && retryStatusCodes.includes(error.status)) {
		return true;
	}
	
	return false;
}

export async function calculateRetryDelay(attempt, retryDelay, backoffType, backoffMaxDelay, retryContext) {
	let delay = retryDelay;
	
	// Handle custom retry delay function
	if (typeof retryDelay === 'function') {
		delay = retryDelay(retryContext);
	} else if (backoffType) {
		// Use Luminara's backoff strategy
		const backoffHandler = createBackoffHandler(backoffType, retryDelay, backoffMaxDelay);
		if (backoffHandler) {
			delay = backoffHandler(retryContext) || retryDelay;
		}
	}
	
	if (delay > 0) {
		await new Promise(resolve => setTimeout(resolve, delay));
	}
}

export function createRetryContext(url, method, headers, retry, attempt, response = null, error = null) {
	return {
		request: { url, method, headers },
		options: { retry: retry - (attempt - 1) }, // Match ofetch behavior: remaining retries
		response,
		error
	};
}