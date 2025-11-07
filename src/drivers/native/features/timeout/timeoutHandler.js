/**
 * Timeout and AbortController handling utilities
 * Manages timeout setup and signal combination
 */

import { logTimeout } from '../../../../core/verbose/verboseLogger.js';

export function createTimeoutHandler(timeout, userSignal, context = null) {
	if (timeout === undefined || timeout <= 0) {
		return { signal: userSignal, cleanup: () => {} };
	}
	
	// Log timeout setup
	if (context) {
		logTimeout(context, 'setup', { timeout });
	}
	
	const timeoutController = new AbortController();
	const timeoutId = setTimeout(() => {

		// Log timeout trigger
		if (context) {
			logTimeout(context, 'triggered', { timeout });
		}
		timeoutController.abort();
	}, timeout);
	
	let combinedSignal = userSignal;
	
	// Combine user signal with timeout signal if needed
	if (userSignal) {
		const combinedController = new AbortController();
		const cleanup = () => combinedController.abort();
		userSignal.addEventListener('abort', cleanup);
		timeoutController.signal.addEventListener('abort', cleanup);
		combinedSignal = combinedController.signal;
	} else {
		combinedSignal = timeoutController.signal;
	}
	
	const cleanup = () => {
		if (timeoutId) {
			clearTimeout(timeoutId);

			// Log timeout cleared
			if (context) {
				logTimeout(context, 'cleared');
			}
		}
	};
	
	return { signal: combinedSignal, cleanup };
}