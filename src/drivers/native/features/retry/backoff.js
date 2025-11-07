// Predefined backoff strategies for retry logic
export const backoffStrategies = {
	linear: (retryCount, retryDelay = 1000) => {

		// Linear: always the same delay
		return retryDelay;
	},
	exponential: (retryCount, retryDelay = 1000) => {

		// Exponential: 1s, 2s, 4s, 8s, 16s...
		// For retry count 1,2,3,4... we want delays of base*2^0, base*2^1, base*2^2, base*2^3...
		return Math.pow(2, retryCount - 1) * retryDelay;
	},
	exponentialCapped: (retryCount, retryDelay = 1000, maxDelay = 30000) => {

		// Exponential with cap: max 30s by default
		return Math.min(Math.pow(2, retryCount - 1) * retryDelay, maxDelay);
	},
	fibonacci: (retryCount, retryDelay = 1000) => {

		// Fibonacci sequence: 1s, 1s, 2s, 3s, 5s, 8s...
		// For retry count 1,2,3,4,5,6... we want fib(1), fib(2), fib(3), fib(4), fib(5), fib(6)
		const calculateFibonacci = (num) => {
			if (num <= 0) {
				return 0;
			}
			if (num === 1) {
				return 1;
			}
			if (num === 2) {
				return 1;
			}

			return calculateFibonacci(num - 1) + calculateFibonacci(num - 2);
		};

		return calculateFibonacci(retryCount) * retryDelay;
	},
	custom: (retryCount, retryDelay = 1000, maxDelay, backoffDelays) => {

		// Custom predefined array strategy: use specific delays from array
		// backoffDelays should be an array like [800, 5000, 10000, 15000, ...]
		if (Array.isArray(backoffDelays) && backoffDelays.length > 0) {

			// Use the delay from the array (1-indexed to 0-indexed)
			const delayIndex = retryCount - 1;
			if (delayIndex < backoffDelays.length) {
				return backoffDelays[delayIndex];
			} else {

				// If we've exhausted the array, use the last value
				return backoffDelays[backoffDelays.length - 1];
			}
		}

		// Fallback to linear if no custom delays provided
		return retryDelay;
	},
	jitter: (retryCount, retryDelay = 1000) => {

		// Linear with random jitter to prevent thundering herd
		const jitterAmount = Math.random() * retryDelay;

		return retryDelay + jitterAmount;
	},
	exponentialJitter: (retryCount, retryDelay = 1000, maxDelay = 30000) => {

		// Exponential with jitter and cap
		const exponentialDelay = Math.min(Math.pow(2, retryCount - 1) * retryDelay, maxDelay);
		const jitterAmount = Math.random() * retryDelay;

		return exponentialDelay + jitterAmount;
	}
};

// Create a retryDelay function from a backoff strategy
// Returns a function that can calculate delays based on attempt number
export function createBackoffHandler(backoffType, baseDelay = 1000, backoffMaxDelay, backoffDelays = null, initialDelay = null) {
	const strategy = backoffStrategies[backoffType];
	if (!strategy) {
		return null;
	}

	// Return a function that matches Luminara's context structure
	// (context: { attempt, req, res, error, meta }) => number
	return (context) => {

		// Use the attempt directly from Luminara's context
		const attemptNumber = context.attempt || 1;
		
		// Convert attempt number to retry count (attempt 1 = no retry yet, attempt 2 = 1st retry, etc.)
		// For backoff calculation, we want the retry number (1st retry, 2nd retry, etc.)
		const retryCount = attemptNumber - 1;
		
		// Only calculate delay for actual retries (attempt > 1)
		if (retryCount <= 0) {
			return 0; // No delay for initial attempt
		}
		
		// Handle initial delay for the first retry (attempt 2 = retryCount 1)
		if (retryCount === 1 && initialDelay !== null && initialDelay !== undefined) {
			return initialDelay;
		}
		
		// For custom strategy, pass the backoffDelays array
		let calculatedDelay;
		if (backoffType === 'custom') {
			calculatedDelay = strategy(retryCount, baseDelay, backoffMaxDelay, backoffDelays);
		} else {
			calculatedDelay = strategy(retryCount, baseDelay, backoffMaxDelay);
		}
		
		return calculatedDelay;
	};
}
