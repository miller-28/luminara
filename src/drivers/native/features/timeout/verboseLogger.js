/**
 * Timeout feature verbose logger
 * Handles detailed logging for timeout configuration, setup, and timeout events
 */

import { BaseVerboseLogger } from '../../../../core/verbose/BaseVerboseLogger.js';

export class TimeoutVerboseLogger extends BaseVerboseLogger {
	
	constructor() {
		super('TIMEOUT');
	}

	/**
	 * Log timeout configuration setup
	 */
	logTimeoutSetup(context, timeoutValue, source = 'options') {
		this.config(context, { 
			timeout: timeoutValue,
			source: source
		}, `Timeout configured: ${timeoutValue}ms from ${source}`);
	}

	/**
	 * Log timeout controller creation
	 */
	logTimeoutControllerCreated(context, timeoutValue) {
		this.log(context, 'CONTROLLER', `Created AbortController for ${timeoutValue}ms timeout`, {
			controllerId: 'timeout',
			signal: 'active',
			timeout: timeoutValue
		});
	}

	/**
	 * Log timeout triggered
	 */
	logTimeoutTriggered(context, timeoutValue, elapsedTime) {
		this.error(context, 'TRIGGERED', `Request timed out after ${elapsedTime}ms`, {
			configuredTimeout: timeoutValue,
			elapsedTime: elapsedTime,
			exceeded: elapsedTime >= timeoutValue
		});
	}

	/**
	 * Log timeout aborted (request completed before timeout)
	 */
	logTimeoutAborted(context, timeoutValue, completionTime) {
		this.log(context, 'ABORTED', `Timeout cancelled - request completed in ${completionTime}ms`, {
			configuredTimeout: timeoutValue,
			completionTime: completionTime,
			margin: timeoutValue - completionTime
		});
	}

	/**
	 * Log timeout cleanup
	 */
	logTimeoutCleanup(context, reason = 'completed') {
		this.debug(context, 'CLEANUP', `Timeout controller cleanup: ${reason}`, {
			reason: reason,
			signal: 'cleared'
		});
	}
}

// Create singleton instance
const timeoutLogger = new TimeoutVerboseLogger();

export { timeoutLogger };
