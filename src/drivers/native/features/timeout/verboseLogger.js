/**
 * Timeout feature verbose logger
 * Handles detailed logging for timeout configuration, setup, and timeout events
 */

import { verboseLog, logTimeout } from '../../../../core/verboseLogger.js';

export class TimeoutVerboseLogger {
	/**
	 * Log timeout configuration setup
	 */
	static logTimeoutSetup(context, timeoutValue, source = 'options') {
		if (!context?.req?.verbose) return;
		
		logTimeout(context, 'setup', { 
			timeout: timeoutValue,
			source: source // 'options', 'default', 'global'
		});
	}

	/**
	 * Log timeout controller creation
	 */
	static logTimeoutControllerCreated(context, timeoutValue) {
		if (!context?.req?.verbose) return;
		
		verboseLog(context, 'TIMEOUT', `Created AbortController for ${timeoutValue}ms timeout`, {
			controllerId: 'timeout',
			signal: 'active'
		});
	}

	/**
	 * Log timeout signal combination with user signal
	 */
	static logSignalCombination(context, hasUserSignal) {
		if (!context?.req?.verbose) return;
		
		if (hasUserSignal) {
			verboseLog(context, 'TIMEOUT', 'Combined timeout signal with user abort signal', {
				signals: 'timeout + user'
			});
		} else {
			verboseLog(context, 'TIMEOUT', 'Using timeout signal only', {
				signals: 'timeout only'
			});
		}
	}

	/**
	 * Log timeout timer start
	 */
	static logTimeoutTimerStart(context, timeoutValue) {
		if (!context?.req?.verbose) return;
		
		verboseLog(context, 'TIMEOUT', `Started timeout timer: ${timeoutValue}ms`, {
			startTime: Date.now(),
			timeoutId: 'active'
		});
	}

	/**
	 * Log timeout triggered event
	 */
	static logTimeoutTriggered(context, timeoutValue, elapsedTime) {
		if (!context?.req?.verbose) return;
		
		logTimeout(context, 'triggered', {
			timeout: timeoutValue,
			elapsed: elapsedTime,
			accuracy: Math.abs(elapsedTime - timeoutValue)
		});
	}

	/**
	 * Log timeout cleared successfully
	 */
	static logTimeoutCleared(context, reason = 'success') {
		if (!context?.req?.verbose) return;
		
		logTimeout(context, 'cleared', {
			reason: reason // 'success', 'error', 'abort'
		});
	}

	/**
	 * Log timeout error creation
	 */
	static logTimeoutErrorCreated(context, timeoutValue, options) {
		if (!context?.req?.verbose) return;
		
		verboseLog(context, 'TIMEOUT', `Created TimeoutError after ${timeoutValue}ms`, {
			errorName: 'TimeoutError',
			status: null,
			url: options?.url,
			method: options?.method
		});
	}

	/**
	 * Log timeout detection from abort signal
	 */
	static logTimeoutDetection(context, signal, timeoutValue) {
		if (!context?.req?.verbose) return;
		
		verboseLog(context, 'TIMEOUT', 'Detected timeout from AbortSignal', {
			signalAborted: signal?.aborted,
			timeoutConfigured: timeoutValue !== undefined,
			detection: 'abort-signal'
		});
	}

	/**
	 * Log timeout configuration validation
	 */
	static logTimeoutValidation(context, timeoutValue, isValid, reason) {
		if (!context?.req?.verbose) return;
		
		verboseLog(context, 'TIMEOUT', `Timeout validation: ${isValid ? 'valid' : 'invalid'}`, {
			value: timeoutValue,
			valid: isValid,
			reason: reason
		});
	}
}

// Convenience functions for direct usage
export function logTimeoutSetup(context, timeoutValue, source) {
	TimeoutVerboseLogger.logTimeoutSetup(context, timeoutValue, source);
}

export function logTimeoutTriggered(context, timeoutValue, elapsedTime) {
	TimeoutVerboseLogger.logTimeoutTriggered(context, timeoutValue, elapsedTime);
}

export function logTimeoutCleared(context, reason) {
	TimeoutVerboseLogger.logTimeoutCleared(context, reason);
}