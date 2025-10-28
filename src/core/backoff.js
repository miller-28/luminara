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
		const calculateFibonacci = (num) => num <= 1 ? 1 : calculateFibonacci(num - 1) + calculateFibonacci(num - 2);
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

	// Track the original retry count and current attempt
	let originalRetryCount = null;
	let currentAttempt = 0;

	// Return a function that matches ofetch's retryDelay signature:
	// (context: FetchContext) => number
	return (context) => {
		// On first call, save the original retry count
		if (originalRetryCount === null) {
			originalRetryCount = context.options.retry || 0;
		}

		// Calculate which attempt this is
		// ofetch decrements retry count, so we can calculate the attempt number
		const remainingRetries = context.options.retry || 0;
		const retryAttempt = originalRetryCount - remainingRetries;
		
		const calculatedDelay = strategy(retryAttempt, baseDelay, backoffMaxDelay);
		console.log(`[Luminara ${backoffType}] Retry attempt ${retryAttempt}/${originalRetryCount} after ${calculatedDelay}ms`);
		return calculatedDelay;
	};
}
