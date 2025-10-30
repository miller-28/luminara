// Predefined backoff strategies for retry logic
export const backoffStrategies = {
	linear: (retryCount, retryDelay = 1000) => {
		// Linear: always the same delay
		return retryDelay;
	},
	exponential: (retryCount, retryDelay = 1000) => {
		// Exponential: 1s, 2s, 4s, 8s, 16s...
		return Math.pow(2, retryCount) * retryDelay;
	},
	exponentialCapped: (retryCount, retryDelay = 1000, maxDelay = 30000) => {
		// Exponential with cap: max 30s by default
		return Math.min(Math.pow(2, retryCount) * retryDelay, maxDelay);
	},
	fibonacci: (retryCount, retryDelay = 1000) => {
		// Fibonacci sequence: 1s, 1s, 2s, 3s, 5s, 8s...
		const calculateFibonacci = (num) => {
			if (num <= 0) return 0;
			if (num === 1) return 1;
			if (num === 2) return 1;
			return calculateFibonacci(num - 1) + calculateFibonacci(num - 2);
		};
		return calculateFibonacci(retryCount) * retryDelay;
	},
	jitter: (retryCount, retryDelay = 1000) => {
		// Linear with random jitter to prevent thundering herd
		const jitterAmount = Math.random() * retryDelay;
		return retryDelay + jitterAmount;
	},
	exponentialJitter: (retryCount, retryDelay = 1000, maxDelay = 30000) => {
		// Exponential with jitter and cap
		const exponentialDelay = Math.min(Math.pow(2, retryCount) * retryDelay, maxDelay);
		const jitterAmount = Math.random() * retryDelay;
		return exponentialDelay + jitterAmount;
	}
};

// Create a retryDelay function from a backoff strategy
// Returns a function that ofetch can use as retryDelay option
export function createBackoffHandler(backoffType, baseDelay = 1000, backoffMaxDelay) {
	const strategy = backoffStrategies[backoffType];
	if (!strategy) {
		return null;
	}

	// Track the original retry count to calculate attempt number
	let originalRetryCount = null;

	// Return a function that matches ofetch's retryDelay signature:
	// (context: { request, options, response, error }) => number
	return (context) => {
		// On first call, save the original retry count from the first call
		if (originalRetryCount === null) {
			// Since retry decrements, we can infer the original count
			// If this is the first retry call, we need to add 1 to get the original
			originalRetryCount = context.options.retry + 1;
		}

		// Calculate which attempt this is
		// ofetch decrements retry count, so: attempt = original - current
		const currentRetryCount = context.options.retry;
		const attemptNumber = originalRetryCount - currentRetryCount;
		
		const calculatedDelay = strategy(attemptNumber, baseDelay, backoffMaxDelay);
		return calculatedDelay;
	};
}
