/**
 * Centralized verbose logging system for Luminara
 * Provides consistent logging format and filtering across all features
 */

// Export the base architecture for feature loggers
export { BaseVerboseLogger, verboseLog, formatDuration } from './BaseVerboseLogger.js';

/**
 * Core request logger instance
 */
import { BaseVerboseLogger } from './BaseVerboseLogger.js';

class RequestVerboseLogger extends BaseVerboseLogger {
	
	constructor() {
		super('REQUEST');
	}

	/**
	 * Log request lifecycle events
	 */
	logRequest(context, phase, details = null) {
		if (!this.isVerboseEnabled(context)) return;
		
		switch (phase) {
			case 'start':
				this.log(context, 'START', `Starting ${context.req.method || 'GET'} ${context.req.url}`, {
					method: context.req.method || 'GET',
					headers: context.req.headers ? Object.keys(context.req.headers).length : 0,
					body: context.req.body ? 'present' : 'none',
					timeout: context.req.timeout || 'default',
					retry: context.req.retry || 0
				});
				break;
			case 'complete':
				this.log(context, 'COMPLETE', `Completed in ${details?.duration}ms`, {
					status: details?.status,
					attempt: context.attempt
				});
				break;
			case 'attempt':
				if (context.attempt === 1) {
					this.log(context, 'ATTEMPT', `Attempt ${context.attempt}: Initial request`);
				} else {
					this.log(context, 'ATTEMPT', `Attempt ${context.attempt}: Retry attempt`, {
						previousErrors: context.attempt - 1
					});
				}
				break;
		}
	}
}

class TimeoutVerboseLogger extends BaseVerboseLogger {

	constructor() {
		super('TIMEOUT');
	}

	/**
	 * Log timeout events
	 */
	logTimeout(context, phase, details = null) {
		if (!this.isVerboseEnabled(context)) return;
		
		switch (phase) {
			case 'setup':
				this.log(context, 'SETUP', `Configured timeout: ${details.timeout}ms`);
				break;
			case 'triggered':
				this.error(context, 'TRIGGERED', `Request timed out after ${details.timeout}ms`);
				break;
			case 'cleared':
				this.log(context, 'CLEARED', `Timeout cleared successfully`);
				break;
		}
	}
}

class ResponseVerboseLogger extends BaseVerboseLogger {

	constructor() {
		super('RESPONSE');
	}

	/**
	 * Log response parsing events
	 */
	logResponse(context, phase, details = null) {
		if (!this.isVerboseEnabled(context)) return;
		
		switch (phase) {
			case 'received':
				this.log(context, 'RECEIVED', `Received response`, {
					status: details?.status,
					type: details?.type,
					size: details?.size
				});
				break;
			case 'parsing':
				this.log(context, 'PARSING', `Parsing as ${details.type}`, {
					contentType: details.contentType
				});
				break;
			case 'parsed':
				this.log(context, 'PARSED', `Successfully parsed ${details.type}`, {
					resultType: details.resultType
				});
				break;
		}
	}
}

class ErrorVerboseLogger extends BaseVerboseLogger {

	constructor() {
		super('ERROR');
	}

	/**
	 * Log error handling events
	 */
	logError(context, phase, details = null) {
		if (!this.isVerboseEnabled(context)) return;
		
		switch (phase) {
			case 'caught':
				this.error(context, 'CAUGHT', `Caught ${details.type}: ${details.message}`, {
					status: details.status,
					retryable: details.retryable
				});
				break;
			case 'transformed':
				this.log(context, 'TRANSFORMED', `Error transformed to ${details.newType}`);
				break;
			case 'final':
				this.error(context, 'FINAL', `Final error after ${context.attempt} attempts: ${details.message}`);
				break;
		}
	}
}

class PluginVerboseLogger extends BaseVerboseLogger {

	constructor() {
		super('PLUGIN');
	}

	/**
	 * Log plugin execution events
	 */
	logPlugin(context, phase, details = null) {
		if (!this.isVerboseEnabled(context)) return;
		
		switch (phase) {
			case 'onRequest':
				this.log(context, 'ONREQUEST', `Executing onRequest plugins (${details.count})`, {
					plugins: details.names
				});
				break;
			case 'onResponse':
				this.log(context, 'ONRESPONSE', `Executing onResponse plugins (${details.count})`, {
					plugins: details.names
				});
				break;
			case 'onResponseError':
				this.log(context, 'ONRESPONSEERROR', `Executing onResponseError plugins (${details.count})`, {
					plugins: details.names,
					status: details.status
				});
				break;
		}
	}
}

// Create singleton instances for core loggers
const requestLogger = new RequestVerboseLogger();
const timeoutLogger = new TimeoutVerboseLogger();
const responseLogger = new ResponseVerboseLogger();
const errorLogger = new ErrorVerboseLogger();
const pluginLogger = new PluginVerboseLogger();

// Export modern verbose logging functions
export function logRequest(context, phase, details = null) {
	requestLogger.logRequest(context, phase, details);
}

export function logTimeout(context, phase, details = null) {
	timeoutLogger.logTimeout(context, phase, details);
}

export function logResponse(context, phase, details = null) {
	responseLogger.logResponse(context, phase, details);
}

export function logError(context, phase, details = null) {
	errorLogger.logError(context, phase, details);
}

export function logPlugin(context, phase, details = null) {
	pluginLogger.logPlugin(context, phase, details);
}