/**
 * Timeout and AbortController handling utilities
 * Manages timeout setup and signal combination
 */

export function createTimeoutHandler(timeout, userSignal) {
	if (timeout === undefined || timeout <= 0) {
		return { signal: userSignal, cleanup: () => {} };
	}
	
	const timeoutController = new AbortController();
	const timeoutId = setTimeout(() => {
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
		}
	};
	
	return { signal: combinedSignal, cleanup };
}