/**
 * Error feature verbose logger
 * Handles detailed logging for error catching, transformation, and handling decisions
 */

import { BaseVerboseLogger } from '../../../../core/verbose/BaseVerboseLogger.js';

export class ErrorVerboseLogger extends BaseVerboseLogger {
	
	constructor() {
		super('ERROR');
	}

	/**
	 * Log error caught during request
	 */
	logErrorCaught(context, error, errorSource = 'request') {
		const isRetryable = this.#isRetryableError(error);
		
		this.error(context, 'CAUGHT', `Error caught during ${errorSource}`, {
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
	logErrorClassification(context, error, classification) {
		this.log(context, 'CLASSIFICATION', `Error classified as: ${classification.type}`, {
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
	logErrorTransformation(context, originalError, transformedError, reason) {
		this.log(context, 'TRANSFORMATION', `Error transformed: ${reason}`, {
			from: originalError.name,
			fromMessage: originalError.message,
			to: transformedError.name,
			toMessage: transformedError.message,
			reason: reason
		});
	}

	/**
	 * Log error handling decision
	 */
	logErrorHandlingDecision(context, error, decision, reason) {
		this.log(context, 'DECISION', `Error handling: ${decision}`, {
			errorType: error.name,
			status: error.status,
			decision: decision,
			reason: reason
		});
	}

	/**
	 * Log timeout error
	 */
	logTimeoutError(context, error, timeout) {
		this.error(context, 'TIMEOUT', `Request timed out after ${timeout}ms`, {
			timeout: timeout,
			originalError: error.name,
			message: error.message
		});
	}

	/**
	 * Log abort error
	 */
	logAbortError(context, error, source = 'unknown') {
		this.error(context, 'ABORT', `Request aborted from ${source}`, {
			source: source,
			errorName: error.name,
			message: error.message
		});
	}

	/**
	 * Log network error
	 */
	logNetworkError(context, error) {
		this.error(context, 'NETWORK', 'Network error occurred', {
			errorType: error.name,
			message: error.message,
			cause: error.cause || 'unknown'
		});
	}

	/**
	 * Log HTTP error (non-2xx response)
	 */
	logHttpError(context, response, details) {
		this.error(context, 'HTTP_ERROR', `HTTP ${response.status} ${response.statusText}`, {
			status: response.status,
			statusText: response.statusText,
			url: response.url,
			data: details?.data ? (typeof details.data === 'string' ? details.data.substring(0, 100) : 'object') : 'none'
		});
	}

	/**
	 * Check if error is retryable (private method)
	 */
	#isRetryableError(error) {
		if (error.status >= 500) {
			return true;
		}
		if (error.status === 429) {
			return true;
		}
		if (error.name === 'TimeoutError') {
			return true;
		}
		if (error.name === 'NetworkError') {
			return true;
		}

		return false;
	}

}

// Create singleton instance
const errorLogger = new ErrorVerboseLogger();

export { errorLogger };
