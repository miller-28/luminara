/**
 * Retry feature verbose logger
 * Handles detailed logging for retry strategies, backoff calculations, and retry decisions
 */

import { verboseLog } from '../../../../core/verboseLogger.js';

export class RetryVerboseLogger {
	/**
	 * Log retry configuration setup
	 */
	static logRetrySetup(context, retryCount, retryDelay, backoffType) {
		if (!context?.req?.verbose) return;
		
		verboseLog(context, 'RETRY', `Retry configuration`, {
			maxRetries: retryCount,
			retryDelay: `${retryDelay}ms`,
			backoffType: backoffType || 'static',
			strategy: backoffType ? 'dynamic' : 'static'
		});
	}

	/**
	 * Log retry attempt start
	 */
	static logRetryAttempt(context, attemptNumber, isInitial = false) {
		if (!context?.req?.verbose) return;
		
		if (isInitial) {
			verboseLog(context, 'RETRY', `Attempt ${attemptNumber}: Initial request`, {
				attempt: attemptNumber,
				type: 'initial',
				totalAllowed: (context.req.retry || 0) + 1
			});
		} else {
			verboseLog(context, 'RETRY', `Attempt ${attemptNumber}: Retry attempt`, {
				attempt: attemptNumber,
				type: 'retry',
				remaining: (context.req.retry || 0) - (attemptNumber - 1)
			});
		}
	}

	/**
	 * Log backoff strategy calculation
	 */
	static logBackoffCalculation(context, attemptNumber, backoffType, calculatedDelay, expectedDelay, details = {}) {
		if (!context?.req?.verbose) return;
		
		const strategyInfo = getBackoffStrategyInfo(backoffType, attemptNumber, details.baseDelay, details.maxDelay, details.backoffDelays, details.initialDelay);
		
		verboseLog(context, 'RETRY', `Backoff calculation: ${calculatedDelay}ms${strategyInfo}`, {
			attempt: attemptNumber,
			strategy: backoffType,
			calculated: calculatedDelay,
			expected: expectedDelay,
			formula: strategyInfo.trim()
		});
	}

	/**
	 * Log retry delay execution
	 */
	static logRetryDelay(context, attemptNumber, delayMs, backoffType) {
		if (!context?.req?.verbose) return;
		
		const strategyInfo = getBackoffStrategyInfo(backoffType, attemptNumber, context.req.retryDelay, context.req.backoffMaxDelay, context.req.backoffDelays, context.req.initialDelay);
		
		verboseLog(context, 'RETRY', `Retry after ${delayMs}ms delay${strategyInfo}`, {
			attempt: attemptNumber,
			delay: delayMs,
			strategy: backoffType || 'static'
		});
	}

	/**
	 * Log retry policy evaluation
	 */
	static logRetryPolicyEvaluation(context, error, willRetry, reason, retryPolicy = 'default') {
		if (!context?.req?.verbose) return;
		
		verboseLog(context, 'RETRY', `Retry policy evaluation: ${willRetry ? 'retry' : 'stop'}`, {
			policy: retryPolicy,
			decision: willRetry ? 'retry' : 'stop',
			reason: reason,
			errorType: error?.name,
			status: error?.status,
			attempt: context.attempt
		});
	}

	/**
	 * Log custom retry delay function usage
	 */
	static logCustomRetryFunction(context, customDelay, functionResult) {
		if (!context?.req?.verbose) return;
		
		verboseLog(context, 'RETRY', `Custom retry function executed`, {
			attempt: context.attempt,
			function: 'custom',
			result: functionResult,
			type: typeof functionResult
		});
	}

	/**
	 * Log retry headers analysis (Retry-After)
	 */
	static logRetryHeaders(context, retryAfterHeader, respectedHeader, finalDelay) {
		if (!context?.req?.verbose) return;
		
		if (retryAfterHeader) {
			verboseLog(context, 'RETRY', `Retry-After header: ${retryAfterHeader}`, {
				header: retryAfterHeader,
				respected: respectedHeader,
				finalDelay: finalDelay,
				source: respectedHeader ? 'header' : 'strategy'
			});
		}
	}

	/**
	 * Log retry exhaustion
	 */
	static logRetryExhaustion(context, totalAttempts, totalTime) {
		if (!context?.req?.verbose) return;
		
		verboseLog(context, 'RETRY', `All retries exhausted after ${totalAttempts} attempts`, {
			attempts: totalAttempts,
			totalTime: totalTime ? `${totalTime}ms` : 'unknown',
			result: 'failed',
			exhausted: true
		});
	}

	/**
	 * Log retry success
	 */
	static logRetrySuccess(context, totalAttempts, totalTime) {
		if (!context?.req?.verbose) return;
		
		if (totalAttempts > 1) {
			verboseLog(context, 'RETRY', `Request succeeded after ${totalAttempts} attempts`, {
				attempts: totalAttempts,
				totalTime: totalTime ? `${totalTime}ms` : 'unknown',
				result: 'success',
				recovered: true
			});
		}
	}
}

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

// Convenience functions for direct usage
export function logRetryAttempt(context, attemptNumber, isInitial) {
	RetryVerboseLogger.logRetryAttempt(context, attemptNumber, isInitial);
}

export function logRetryDelay(context, attemptNumber, delayMs, backoffType) {
	RetryVerboseLogger.logRetryDelay(context, attemptNumber, delayMs, backoffType);
}

export function logRetryPolicyEvaluation(context, error, willRetry, reason, retryPolicy) {
	RetryVerboseLogger.logRetryPolicyEvaluation(context, error, willRetry, reason, retryPolicy);
}

export function logRetryExhaustion(context, totalAttempts, totalTime) {
	RetryVerboseLogger.logRetryExhaustion(context, totalAttempts, totalTime);
}

export function logRetrySuccess(context, totalAttempts, totalTime) {
	RetryVerboseLogger.logRetrySuccess(context, totalAttempts, totalTime);
}