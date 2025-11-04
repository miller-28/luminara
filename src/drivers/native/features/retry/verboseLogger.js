/**
 * Verbose logging utilities for retry strategies
 * Shared between different drivers and retry handlers
 */

export function getBackoffStrategyInfo(backoffType, attempt, baseDelay, maxDelay, backoffDelays = null, initialDelay = null) {
	// For verbose logging, we need to show what the calculation SHOULD be
	// This should match EXACTLY what the backoff strategy calculates
	// attempt = current attempt number (1, 2, 3, 4...)
	// retryCount = attempt - 1 for backoff calculations (1, 2, 3... for actual retries)
	const retryCount = attempt - 1;
	
	if (retryCount <= 0) {
		return ''; // No strategy info for initial attempt
	}
	
	// Handle initial delay for first retry
	if (retryCount === 1 && initialDelay !== null && initialDelay !== undefined) {
		return ` (initial delay: ${initialDelay}ms)`;
	}
	
	switch (backoffType) {
		case 'linear':
			return ` (linear: ${baseDelay}ms constant)`;
		case 'exponential':
			// Exponential backoff: Math.pow(2, retryCount - 1) * baseDelay
			// For retryCount 1,2,3,4... we get 2^0, 2^1, 2^2, 2^3...
			const expDelay = Math.pow(2, retryCount - 1) * baseDelay;
			return ` (exponential: expected ${expDelay}ms = 2^${retryCount-1}×${baseDelay})`;
		case 'exponentialCapped':
			const uncappedDelay = Math.pow(2, retryCount - 1) * baseDelay;
			const cappedDelay = Math.min(uncappedDelay, maxDelay);
			return ` (exp-capped: expected ${cappedDelay}ms, uncapped: ${uncappedDelay}ms, max: ${maxDelay}ms)`;
		case 'fibonacci':
			// Fibonacci backoff: calculateFibonacci(retryCount) * baseDelay
			// For retryCount 1,2,3,4,5,6... we get fib(1), fib(2), fib(3), fib(4), fib(5), fib(6)...
			const fibNumber = calculateFibonacci(retryCount);
			const fibDelay = fibNumber * baseDelay;
			return ` (fibonacci: expected ${fibDelay}ms = fib(${retryCount})=${fibNumber} × ${baseDelay})`;
		case 'custom':
			// Custom array strategy
			if (Array.isArray(backoffDelays) && backoffDelays.length > 0) {
				const delayIndex = retryCount - 1;
				let expectedDelay;
				if (delayIndex < backoffDelays.length) {
					expectedDelay = backoffDelays[delayIndex];
					return ` (custom: array[${delayIndex}] = ${expectedDelay}ms)`;
				} else {
					expectedDelay = backoffDelays[backoffDelays.length - 1];
					return ` (custom: array[${backoffDelays.length - 1}] = ${expectedDelay}ms, last value)`;
				}
			}
			return ` (custom: fallback to linear ${baseDelay}ms)`;
		case 'jitter':
			return ` (jitter: expected ${baseDelay}-${baseDelay * 2}ms range)`;
		case 'exponentialJitter':
			const expJitterBase = Math.min(Math.pow(2, retryCount - 1) * baseDelay, maxDelay || Infinity);
			return ` (exp-jitter: expected ${expJitterBase}-${expJitterBase + baseDelay}ms range)`;
		default:
			return ` (${backoffType})`;
	}
}

function calculateFibonacci(num) {
	if (num <= 0) return 0;
	if (num === 1) return 1;
	if (num === 2) return 1;
	return calculateFibonacci(num - 1) + calculateFibonacci(num - 2);
}