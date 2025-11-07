/**
 * Retry feature verbose logger
 * Handles detailed logging for retry configuration, attempts, backoff calculations, and policy decisions
 */

import { BaseVerboseLogger } from '../../../../core/verbose/BaseVerboseLogger.js';

export class RetryVerboseLogger extends BaseVerboseLogger {
	
	constructor() {
		super('RETRY');
	}

	logRetrySetup(context, retryCount, retryDelay, backoffType) {
		this.config(context, {
			maxRetries: retryCount,
			initialDelay: retryDelay,
			backoffStrategy: backoffType || 'linear'
		}, 'Retry system configured');
	}

	logRetryAttempt(context, attemptNumber, isInitial = false) {
		if (isInitial) {
			this.log(context, 'ATTEMPT', `Attempt ${attemptNumber}: Initial request`, {
				attempt: attemptNumber,
				type: 'initial',
				totalAllowed: (context.req.retry || 0) + 1
			});
		} else {
			this.log(context, 'ATTEMPT', `Attempt ${attemptNumber}: Retry attempt`, {
				attempt: attemptNumber,
				type: 'retry',
				remaining: (context.req.retry || 0) - (attemptNumber - 1)
			});
		}
	}

	logRetryDelay(context, attemptNumber, delayMs, backoffType) {
		this.timing(context, `DELAY[${backoffType}]`, delayMs, {
			attempt: attemptNumber,
			strategy: backoffType,
			delay: `${delayMs}ms`
		});
	}

	logRetryExhaustion(context, totalAttempts, totalTime) {
		this.error(context, 'EXHAUSTED', `All retry attempts exhausted`, {
			totalAttempts: totalAttempts,
			totalTime: `${totalTime}ms`,
			finalOutcome: 'failed'
		});
	}
}

// Create singleton instance
const retryLogger = new RetryVerboseLogger();

export function logRetryAttempt(context, attemptNumber, isInitial) {
	retryLogger.logRetryAttempt(context, attemptNumber, isInitial);
}

export function logRetryDelay(context, attemptNumber, delayMs, backoffType) {
	retryLogger.logRetryDelay(context, attemptNumber, delayMs, backoffType);
}

export function logRetryExhaustion(context, totalAttempts, totalTime) {
	retryLogger.logRetryExhaustion(context, totalAttempts, totalTime);
}

export function logRetrySetup(context, retryCount, retryDelay, backoffType) {
	retryLogger.logRetrySetup(context, retryCount, retryDelay, backoffType);
}

/**
 * Get backoff strategy information for logging purposes
 * This function provides human-readable strategy information for console logging
 */
export function getBackoffStrategyInfo(backoffType, attempt, baseDelay, maxDelay, backoffDelays, initialDelay) {
	if (!backoffType || backoffType === 'static') {
		return '';
	}

	try {
		let strategyInfo = ` (${backoffType} backoff`;
		
		switch (backoffType) {
			case 'exponential':
				if (baseDelay && attempt) {
					const multiplier = 2; // Default exponential multiplier
					const calculated = baseDelay * Math.pow(multiplier, attempt - 1);
					strategyInfo += `: ${baseDelay}ms * ${multiplier}^${attempt - 1} = ${calculated}ms`;
					if (maxDelay) {
						strategyInfo += `, capped at ${maxDelay}ms`;
					}
				}
				break;
				
			case 'linear':
				if (baseDelay && attempt) {
					const calculated = baseDelay * attempt;
					strategyInfo += `: ${baseDelay}ms * ${attempt} = ${calculated}ms`;
					if (maxDelay) {
						strategyInfo += `, capped at ${maxDelay}ms`;
					}
				}
				break;
				
			case 'fibonacci':
				if (baseDelay && attempt) {
					const fibNumber = calculateFibonacci(attempt);
					const calculated = baseDelay * fibNumber;
					strategyInfo += `: ${baseDelay}ms * fib(${attempt}) = ${calculated}ms`;
					if (maxDelay) {
						strategyInfo += `, capped at ${maxDelay}ms`;
					}
				}
				break;
				
			case 'custom':
				if (Array.isArray(backoffDelays) && backoffDelays.length > 0) {
					const index = Math.min(attempt - 1, backoffDelays.length - 1);
					strategyInfo += `: custom delays[${index}] = ${backoffDelays[index]}ms`;
				} else {
					strategyInfo += ': custom function';
				}
				break;
				
			default:
				strategyInfo += `: ${backoffType}`;
				break;
		}
		
		return strategyInfo + ')';
	} catch (error) {
		return ` (${backoffType} backoff)`;
	}
}

/**
 * Calculate fibonacci number (helper function for backoff info)
 */
function calculateFibonacci(num) {
	if (num <= 0) return 0;
	if (num === 1) return 1;
	if (num === 2) return 1;
	return calculateFibonacci(num - 1) + calculateFibonacci(num - 2);
}

export { retryLogger };