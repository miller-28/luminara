/**
 * Centralized verbose logging system for Luminara
 * Provides consistent logging format and filtering across all features
 */

/**
 * Main verbose logger that checks if verbose mode is enabled
 * @param {boolean|object} verbose - verbose flag or context with verbose flag
 * @param {string} category - feature category (e.g., 'REQUEST', 'RETRY', 'TIMEOUT', 'RESPONSE', 'ERROR', 'PLUGIN')
 * @param {string} message - log message
 * @param {object} details - optional details object
 */
export function verboseLog(verbose, category, message, details = null) {
	// Check if verbose logging is enabled
	const isVerbose = typeof verbose === 'boolean' ? verbose : (verbose?.verbose || verbose?.req?.verbose);
	
	if (!isVerbose) {
		return;
	}
	
	// Create emoji prefix for category
	const categoryEmoji = getCategoryEmoji(category);
	
	// Format the log message
	let logMessage = `${categoryEmoji} [Luminara] ${category}: ${message}`;
	
	// Add details if provided
	if (details) {
		logMessage += ` ${formatDetails(details)}`;
	}
	
	console.info(logMessage);
}

/**
 * Log request lifecycle events
 */
export function logRequest(context, phase, details = null) {
	if (!context?.req?.verbose) return;
	
	switch (phase) {
		case 'start':
			verboseLog(context, 'REQUEST', `Starting ${context.req.method || 'GET'} ${context.req.url}`, {
				method: context.req.method || 'GET',
				headers: context.req.headers ? Object.keys(context.req.headers).length : 0,
				body: context.req.body ? 'present' : 'none',
				timeout: context.req.timeout || 'default',
				retry: context.req.retry || 0
			});
			break;
		case 'complete':
			verboseLog(context, 'REQUEST', `Completed in ${details?.duration}ms`, {
				status: details?.status,
				attempt: context.attempt
			});
			break;
		case 'attempt':
			if (context.attempt === 1) {
				verboseLog(context, 'REQUEST', `Attempt ${context.attempt}: Initial request`);
			} else {
				verboseLog(context, 'REQUEST', `Attempt ${context.attempt}: Retry attempt`, {
					previousErrors: context.attempt - 1
				});
			}
			break;
	}
}

/**
 * Log timeout events
 */
export function logTimeout(context, phase, details = null) {
	if (!context?.req?.verbose) return;
	
	switch (phase) {
		case 'setup':
			verboseLog(context, 'TIMEOUT', `Configured timeout: ${details.timeout}ms`);
			break;
		case 'triggered':
			verboseLog(context, 'TIMEOUT', `Request timed out after ${details.timeout}ms`);
			break;
		case 'cleared':
			verboseLog(context, 'TIMEOUT', `Timeout cleared successfully`);
			break;
	}
}

/**
 * Log response parsing events
 */
export function logResponse(context, phase, details = null) {
	if (!context?.req?.verbose) return;
	
	switch (phase) {
		case 'received':
			verboseLog(context, 'RESPONSE', `Received response`, {
				status: details?.status,
				type: details?.type,
				size: details?.size
			});
			break;
		case 'parsing':
			verboseLog(context, 'RESPONSE', `Parsing as ${details.type}`, {
				contentType: details.contentType
			});
			break;
		case 'parsed':
			verboseLog(context, 'RESPONSE', `Successfully parsed ${details.type}`, {
				resultType: details.resultType
			});
			break;
	}
}

/**
 * Log error handling events
 */
export function logError(context, phase, details = null) {
	if (!context?.req?.verbose) return;
	
	switch (phase) {
		case 'caught':
			verboseLog(context, 'ERROR', `Caught ${details.type}: ${details.message}`, {
				status: details.status,
				retryable: details.retryable
			});
			break;
		case 'transformed':
			verboseLog(context, 'ERROR', `Error transformed to ${details.newType}`);
			break;
		case 'final':
			verboseLog(context, 'ERROR', `Final error after ${context.attempt} attempts: ${details.message}`);
			break;
	}
}

/**
 * Log plugin execution events
 */
export function logPlugin(context, phase, details = null) {
	if (!context?.req?.verbose) return;
	
	switch (phase) {
		case 'onRequest':
			verboseLog(context, 'PLUGIN', `Executing onRequest plugins (${details.count})`, {
				plugins: details.names
			});
			break;
		case 'onSuccess':
			verboseLog(context, 'PLUGIN', `Executing onSuccess plugins (${details.count})`, {
				plugins: details.names
			});
			break;
		case 'onError':
			verboseLog(context, 'PLUGIN', `Executing onError plugins (${details.count})`, {
				plugins: details.names,
				error: details.error
			});
			break;
		case 'onResponseError':
			verboseLog(context, 'PLUGIN', `Executing onResponseError plugins (${details.count})`, {
				plugins: details.names,
				status: details.status
			});
			break;
	}
}

/**
 * Get emoji prefix for log category
 */
function getCategoryEmoji(category) {
	const emojis = {
		'REQUEST': '🚀',
		'RETRY': '🔄', 
		'TIMEOUT': '⏰',
		'RESPONSE': '📥',
		'ERROR': '❌',
		'PLUGIN': '🔌',
		'STATS': '📊'
	};
	return emojis[category] || '📋';
}

/**
 * Format details object for logging
 */
function formatDetails(details) {
	if (!details || typeof details !== 'object') {
		return '';
	}
	
	const formatted = Object.entries(details)
		.filter(([_, value]) => value !== null && value !== undefined)
		.map(([key, value]) => {
			if (Array.isArray(value)) {
				return `${key}: [${value.join(', ')}]`;
			}
			return `${key}: ${value}`;
		})
		.join(', ');
	
	return formatted ? `(${formatted})` : '';
}