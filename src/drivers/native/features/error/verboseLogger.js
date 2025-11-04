/**
 * Error feature verbose logger
 * Handles detailed logging for error catching, transformation, and handling decisions
 */

import { verboseLog, logError } from '../../../../core/verboseLogger.js';

export class ErrorVerboseLogger {
	/**
	 * Log error caught during request
	 */
	static logErrorCaught(context, error, errorSource = 'request') {
		if (!context?.req?.verbose) return;
		
		const isRetryable = ErrorVerboseLogger.#isRetryableError(error);
		
		logError(context, 'caught', {
			type: error.name || 'Error',
			message: error.message,
			status: error.status,
			retryable: isRetryable,
			source: errorSource
		});
	}

	/**
	 * Log error classification and analysis
	 */
	static logErrorClassification(context, error, classification) {
		if (!context?.req?.verbose) return;
		
		verboseLog(context, 'ERROR', `Error classified as: ${classification.type}`, {
			errorName: error.name,
			classification: classification.type,
			httpStatus: error.status,
			networkError: classification.isNetwork,
			timeoutError: classification.isTimeout,
			retryable: classification.isRetryable
		});
	}

	/**
	 * Log error transformation
	 */
	static logErrorTransformation(context, originalError, transformedError, reason) {
		if (!context?.req?.verbose) return;
		
		logError(context, 'transformed', {
			from: originalError.name,
			fromMessage: originalError.message,
			to: transformedError.name,
			toMessage: transformedError.message,
			reason: reason
		});
	}

	/**
	 * Log retry decision for error
	 */
	static logRetryDecision(context, error, willRetry, reason) {
		if (!context?.req?.verbose) return;
		
		verboseLog(context, 'ERROR', `Retry decision: ${willRetry ? 'will retry' : 'will not retry'}`, {
			attempt: context.attempt,
			maxAttempts: context.req.retry + 1,
			errorType: error.name,
			status: error.status,
			decision: willRetry ? 'retry' : 'fail',
			reason: reason
		});
	}

	/**
	 * Log HTTP error details
	 */
	static logHttpError(context, response, error) {
		if (!context?.req?.verbose) return;
		
		verboseLog(context, 'ERROR', `HTTP ${response?.status} error`, {
			status: response?.status,
			statusText: response?.statusText,
			url: context.req.url,
			method: context.req.method,
			hasBody: !!error.data,
			headers: response?.headers ? 'present' : 'none'
		});
	}

	/**
	 * Log network error details
	 */
	static logNetworkError(context, error) {
		if (!context?.req?.verbose) return;
		
		verboseLog(context, 'ERROR', 'Network error detected', {
			type: error.name,
			message: error.message,
			cause: error.cause?.message || 'unknown',
			url: context.req.url,
			connectivity: 'lost'
		});
	}

	/**
	 * Log timeout error details
	 */
	static logTimeoutError(context, error, timeoutValue) {
		if (!context?.req?.verbose) return;
		
		verboseLog(context, 'ERROR', `Request timeout after ${timeoutValue}ms`, {
			type: 'TimeoutError',
			timeout: timeoutValue,
			url: context.req.url,
			method: context.req.method,
			signal: error.signal ? 'aborted' : 'unknown'
		});
	}

	/**
	 * Log abort error details
	 */
	static logAbortError(context, error, abortReason) {
		if (!context?.req?.verbose) return;
		
		verboseLog(context, 'ERROR', 'Request aborted', {
			type: 'AbortError',
			reason: abortReason,
			url: context.req.url,
			method: context.req.method,
			userInitiated: abortReason === 'user'
		});
	}

	/**
	 * Log final error after all retries exhausted
	 */
	static logFinalError(context, error) {
		if (!context?.req?.verbose) return;
		
		logError(context, 'final', {
			type: error.name,
			message: error.message,
			status: error.status,
			attempts: context.attempt,
			totalTime: context.meta?.totalTime || 'unknown'
		});
	}

	/**
	 * Log error recovery attempt
	 */
	static logErrorRecovery(context, error, recoveryStrategy) {
		if (!context?.req?.verbose) return;
		
		verboseLog(context, 'ERROR', `Attempting error recovery: ${recoveryStrategy}`, {
			errorType: error.name,
			strategy: recoveryStrategy,
			attempt: context.attempt,
			url: context.req.url
		});
	}

	/**
	 * Log error enrichment
	 */
	static logErrorEnrichment(context, error, enrichmentData) {
		if (!context?.req?.verbose) return;
		
		verboseLog(context, 'ERROR', 'Enriching error with additional context', {
			errorType: error.name,
			enrichments: Object.keys(enrichmentData),
			url: enrichmentData.url || 'none',
			options: enrichmentData.options ? 'present' : 'none'
		});
	}

	/**
	 * Check if error is retryable (helper method)
	 */
	static #isRetryableError(error) {
		// Network errors are typically retryable
		if (!error.status) return true;
		
		// 5xx errors are retryable
		if (error.status >= 500) return true;
		
		// 429 (Too Many Requests) is retryable
		if (error.status === 429) return true;
		
		// 408 (Request Timeout) is retryable
		if (error.status === 408) return true;
		
		// Other 4xx errors are not retryable
		return false;
	}
}

// Convenience functions for direct usage
export function logErrorCaught(context, error, errorSource) {
	ErrorVerboseLogger.logErrorCaught(context, error, errorSource);
}

export function logRetryDecision(context, error, willRetry, reason) {
	ErrorVerboseLogger.logRetryDecision(context, error, willRetry, reason);
}

export function logHttpError(context, response, error) {
	ErrorVerboseLogger.logHttpError(context, response, error);
}

export function logNetworkError(context, error) {
	ErrorVerboseLogger.logNetworkError(context, error);
}

export function logTimeoutError(context, error, timeoutValue) {
	ErrorVerboseLogger.logTimeoutError(context, error, timeoutValue);
}

export function logFinalError(context, error) {
	ErrorVerboseLogger.logFinalError(context, error);
}