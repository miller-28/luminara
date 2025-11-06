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
	 * Check if error is retryable (private method)
	 */
	#isRetryableError(error) {
		if (error.status >= 500) return true;
		if (error.status === 429) return true;
		if (error.name === 'TimeoutError') return true;
		if (error.name === 'NetworkError') return true;
		return false;
	}
}

// Create singleton instance
const errorLogger = new ErrorVerboseLogger();

export { errorLogger };
