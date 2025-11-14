/**
 * Hedging policies implementation
 * Each policy defines a different strategy for sending hedge requests
 */

/**
 * Calculate delay with exponential backoff
 */
export function calculateDelay(attempt, config) {
	const { hedgeDelay, exponentialBackoff, backoffMultiplier = 1.5 } = config;
	
	if (!exponentialBackoff) {
		return hedgeDelay;
	}
	
	// Exponential backoff: delay * multiplier^attempt
	const delay = hedgeDelay * Math.pow(backoffMultiplier, attempt);
	return Math.floor(delay);
}

/**
 * Apply jitter to delay value
 */
export function applyJitter(delay, jitterRange = 0.2) {
	// Random value between (1 - jitterRange) and (1 + jitterRange)
	const jitterFactor = 1 + (Math.random() * 2 - 1) * jitterRange;
	return Math.floor(delay * jitterFactor);
}

/**
 * Cancel-and-Retry Policy
 * Sequential execution: cancel previous request before sending next
 */
export async function cancelAndRetryPolicy(coordinator) {
	const { config, executeRequest, verbose, startTime } = coordinator;
	const { maxHedges, hedgeDelay, exponentialBackoff, jitter, jitterRange } = config;
	
	let currentController = null;
	let lastError = null;
	
	// Try primary first
	try {
		currentController = new AbortController();
		coordinator.controllers.push(currentController);
		
		const result = await Promise.race([
			executeRequest(0, 'primary', currentController.signal),
			new Promise((_, reject) => 
				setTimeout(() => reject(new Error('HedgeDelay')), hedgeDelay))
		]);
		
		// Primary succeeded within hedgeDelay
		return result;
	} catch (error) {
		if (error.message !== 'HedgeDelay') {
			lastError = { type: 'primary', error: error.message };
		}
		
		// Cancel primary if it's still running
		if (currentController && !currentController.signal.aborted) {
			currentController.abort();
			if (verbose) {
				const elapsed = Date.now() - startTime;
				console.log(`[HEDGING] Primary request cancelled at T+${elapsed}ms`);
			}
		}
	}
	
	// Send hedges sequentially with cancellation
	for (let hedgeIndex = 1; hedgeIndex <= maxHedges; hedgeIndex++) {
		try {
			// Calculate delay with backoff/jitter
			let delay = calculateDelay(hedgeIndex - 1, config);
			if (jitter) {
				delay = applyJitter(delay, jitterRange);
			}
			
			// Create new controller for this hedge
			currentController = new AbortController();
			coordinator.controllers.push(currentController);
			
			if (verbose) {
				const elapsed = Date.now() - startTime;
				console.log(`[HEDGING] Hedge #${hedgeIndex} triggered at T+${elapsed}ms`);
			}
			
			const result = await Promise.race([
				executeRequest(hedgeIndex, `hedge-${hedgeIndex}`, currentController.signal),
				new Promise((_, reject) => 
					setTimeout(() => reject(new Error('HedgeDelay')), delay))
			]);
			
			// Hedge succeeded
			return result;
		} catch (error) {
			if (error.message !== 'HedgeDelay') {
				lastError = { type: `hedge-${hedgeIndex}`, error: error.message };
			}
			
			// Cancel this hedge if still running
			if (currentController && !currentController.signal.aborted) {
				currentController.abort();
			}
		}
	}
	
	// All attempts failed
	throw createHedgingError(coordinator, lastError);
}

/**
 * Race Policy
 * Concurrent execution: all requests run simultaneously, first success wins
 */
export async function racePolicy(coordinator) {
	const { config, executeRequest, verbose, startTime } = coordinator;
	const { maxHedges, hedgeDelay, exponentialBackoff, jitter, jitterRange } = config;
	
	const promises = [];
	const errors = [];
	const controllers = []; // Track controllers in same order as promises
	
	// Create all controllers upfront to maintain index alignment
	const primaryController = new AbortController();
	coordinator.controllers.push(primaryController);
	controllers.push(primaryController);
	
	const hedgeControllers = [];
	for (let i = 0; i < maxHedges; i++) {
		const ctrl = new AbortController();
		coordinator.controllers.push(ctrl);
		controllers.push(ctrl);
		hedgeControllers.push(ctrl);
	}
	
	// Send primary request
	const primaryPromise = executeRequest(0, 'primary', primaryController.signal)
		.catch(error => {
			// Silently ignore abort errors from cancelled primary
			if (error.name === 'AbortError' || error.message?.includes('aborted')) {
				return null;
			}
			errors.push({ type: 'primary', error: error.message });
			throw error;
		});
	
	promises.push(primaryPromise);
	
	// Schedule hedges with delays
	for (let hedgeIndex = 1; hedgeIndex <= maxHedges; hedgeIndex++) {
		const hedgeController = hedgeControllers[hedgeIndex - 1];
		
		const hedgePromise = (async () => {
			// Calculate delay with backoff/jitter
			let delay = hedgeIndex === 1 ? hedgeDelay : calculateDelay(hedgeIndex - 1, config);
			if (jitter) {
				delay = applyJitter(delay, jitterRange);
			}
			
			// Wait for hedge delay
			await new Promise(resolve => setTimeout(resolve, delay));
			
			// Check if already resolved
			if (coordinator.resolved) {
				return Promise.reject(new Error('Already resolved'));
			}
			
			if (verbose) {
				const elapsed = Date.now() - startTime;
				console.log(`[HEDGING] Hedge #${hedgeIndex} triggered at T+${elapsed}ms`);
			}
			
			return executeRequest(hedgeIndex, `hedge-${hedgeIndex}`, hedgeController.signal)
				.catch(error => {
					// Silently ignore abort errors from cancelled hedges
					if (error.name === 'AbortError' || error.message?.includes('aborted')) {
						return null;
					}
					errors.push({ type: `hedge-${hedgeIndex}`, error: error.message });
					throw error;
				});
		})();
		
		promises.push(hedgePromise);
	}
	
	try {
		// Race all requests with index tracking
		const wrappedPromises = promises.map((p, index) => 
			p.then(res => ({ success: true, data: res, index }))
			 .catch(err => ({ success: false, error: err, index })));
		
		const result = await Promise.race(wrappedPromises);
		
		if (result && result.success) {
			coordinator.resolved = true;
			
			// Get the winning controller index
			const winningController = controllers[result.index];
			
			// Cancel all other pending requests (but NOT the winning one)
			coordinator.controllers.forEach(ctrl => {
				if (!ctrl.signal.aborted && ctrl !== winningController) {
					ctrl.abort();
				}
			});
			
			if (verbose && config.cancelOnSuccess) {
				console.log(`[HEDGING] Cancelling ${coordinator.controllers.length - 1} pending requests`);
			}
			
			return result.data;
		}
		
		// All failed - wait for all promises to settle to collect errors
		await Promise.allSettled(promises);
		throw createHedgingError(coordinator, errors[0] || { type: 'unknown', error: 'All requests failed' });
	} catch (error) {
		if (error.name === 'HedgingError') {
			throw error;
		}
		throw createHedgingError(coordinator, { type: 'race', error: error.message });
	}
}

/**
 * Create hedging error with all attempt details
 */
function createHedgingError(coordinator, lastError) {
	const error = new Error('All hedge requests failed');
	error.name = 'HedgingError';
	error.attempts = coordinator.errors.length > 0 ? coordinator.errors : [lastError];
	error.policy = coordinator.config.policy;
	error.totalAttempts = coordinator.controllers.length;
	
	if (coordinator.verbose) {
		console.error(`[HEDGING] All requests failed after ${error.totalAttempts} attempts`);
		error.attempts.forEach(({ type, error: msg }) => {
			console.error(`[HEDGING] ${type}: ${msg}`);
		});
	}
	
	return error;
}
