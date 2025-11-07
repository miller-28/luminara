/**
 * Base Verbose Logger Architecture
 * 
 * Unified logging system for all Luminara features.
 * Provides consistent structure, formatting, and behavior across all loggers.
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
	
	// Format the log message with timestamp
	const timestamp = new Date().toISOString();
	let logMessage = `${timestamp} ${categoryEmoji} [Luminara] ${category}: ${message}`;
	
	// Add details if provided
	if (details) {
		logMessage += ` ${formatDetails(details)}`;
	}
	
	console.info(logMessage);
}

/**
 * Base class for all feature verbose loggers
 * Provides standardized structure and common functionality
 */
export class BaseVerboseLogger {
	
	/**
	 * Create a feature logger instance
	 * @param {string} featureName - Name of the feature (e.g., 'RETRY', 'TIMEOUT')
	 */
	constructor(featureName) {
		this.featureName = featureName;
		this.category = featureName.toUpperCase();
	}

	/**
	 * Check if verbose logging is enabled for context
	 * @param {object} context - Request context
	 * @returns {boolean} True if verbose logging should occur
	 */
	isVerboseEnabled(context) {
		return !!(context?.req?.verbose || context?.verbose);
	}

	/**
	 * Log a message for this feature
	 * @param {object} context - Request context
	 * @param {string} operation - Operation being performed
	 * @param {string} message - Log message
	 * @param {object} details - Additional details
	 */
	log(context, operation, message, details = null) {
		if (!this.isVerboseEnabled(context)) {
			return;
		}
		
		const fullMessage = operation ? `${operation}: ${message}` : message;
		verboseLog(context, this.category, fullMessage, details);
	}

	/**
	 * Log an error for this feature
	 * @param {object} context - Request context
	 * @param {string} operation - Operation that failed
	 * @param {string} message - Error message
	 * @param {object} details - Error details
	 */
	error(context, operation, message, details = null) {
		if (!this.isVerboseEnabled(context)) {
			return;
		}
		
		const timestamp = new Date().toISOString();
		const emoji = getCategoryEmoji(this.category);
		const fullMessage = operation ? `${operation}: ${message}` : message;
		let logMessage = `${timestamp} ${emoji} [Luminara] ${this.category} ERROR: ${fullMessage}`;
		
		if (details) {
			logMessage += ` ${formatDetails(details)}`;
		}
		
		console.error(logMessage);
	}

	/**
	 * Log a warning for this feature
	 * @param {object} context - Request context
	 * @param {string} operation - Operation with warning
	 * @param {string} message - Warning message
	 * @param {object} details - Warning details
	 */
	warn(context, operation, message, details = null) {
		if (!this.isVerboseEnabled(context)) {
			return;
		}
		
		const timestamp = new Date().toISOString();
		const emoji = getCategoryEmoji(this.category);
		const fullMessage = operation ? `${operation}: ${message}` : message;
		let logMessage = `${timestamp} ${emoji} [Luminara] ${this.category} WARN: ${fullMessage}`;
		
		if (details) {
			logMessage += ` ${formatDetails(details)}`;
		}
		
		console.warn(logMessage);
	}

	/**
	 * Log debug information for this feature
	 * @param {object} context - Request context
	 * @param {string} operation - Operation being debugged
	 * @param {string} message - Debug message
	 * @param {object} details - Debug details
	 */
	debug(context, operation, message, details = null) {
		if (!this.isVerboseEnabled(context)) {
			return;
		}
		
		const timestamp = new Date().toISOString();
		const emoji = getCategoryEmoji(this.category);
		const fullMessage = operation ? `${operation}: ${message}` : message;
		let logMessage = `${timestamp} ${emoji} [Luminara] ${this.category} DEBUG: ${fullMessage}`;
		
		if (details) {
			logMessage += ` ${formatDetails(details)}`;
		}
		
		console.log(logMessage);
	}

	/**
	 * Log timing information for this feature
	 * @param {object} context - Request context
	 * @param {string} operation - Operation being timed
	 * @param {number} duration - Duration in milliseconds
	 * @param {object} details - Additional timing context
	 */
	timing(context, operation, duration, details = null) {
		if (!this.isVerboseEnabled(context)) {
			return;
		}
		
		const formattedDuration = formatDuration(duration);
		const message = `${operation} completed in ${formattedDuration}`;
		
		this.log(context, 'TIMING', message, {
			duration: `${duration.toFixed(2)}ms`,
			...details
		});
	}

	/**
	 * Log configuration setup for this feature
	 * @param {object} context - Request context
	 * @param {object} config - Configuration being applied
	 * @param {string} description - Description of configuration
	 */
	config(context, config, description = 'Configuration applied') {
		if (!this.isVerboseEnabled(context)) {
			return;
		}
		
		this.log(context, 'CONFIG', description, {
			feature: this.featureName,
			...config
		});
	}

	/**
	 * Log lifecycle events for this feature
	 * @param {object} context - Request context
	 * @param {string} phase - Lifecycle phase (start, progress, complete, fail)
	 * @param {string} message - Phase message
	 * @param {object} details - Phase details
	 */
	lifecycle(context, phase, message, details = null) {
		if (!this.isVerboseEnabled(context)) {
			return;
		}
		
		const phaseUpper = phase.toUpperCase();
		this.log(context, `LIFECYCLE[${phaseUpper}]`, message, details);
	}
}

/**
 * Get emoji prefix for log category
 * @param {string} category - Log category
 * @returns {string} Emoji for category
 */
function getCategoryEmoji(category) {
	const emojis = {
		'REQUEST': '🚀',
		'RETRY': '🔄', 
		'TIMEOUT': '⏰',
		'RESPONSE': '📥',
		'ERROR': '❌',
		'PLUGIN': '🔌',
		'STATS': '📊',
		'RATELIMIT': '🚦',
		'URL': '🔗',
		'CONFIG': '⚙️',
		'LIFECYCLE': '♻️'
	};

	return emojis[category] || '📋';
}

/**
 * Format details object for logging
 * @param {object} details - Details to format
 * @returns {string} Formatted details string
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

/**
 * Format duration for human-readable output
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration string
 */
export function formatDuration(ms) {
	if (ms < 1) {
		return `${(ms * 1000).toFixed(1)}μs`;
	} else if (ms < 1000) {
		return `${ms.toFixed(1)}ms`;
	} else if (ms < 60000) {
		return `${(ms / 1000).toFixed(2)}s`;
	} else {
		return `${(ms / 60000).toFixed(2)}m`;
	}
}

/**
 * Format rate for human-readable output
 * @param {number} rate - Rate per millisecond
 * @param {number} windowMs - Window duration in milliseconds
 * @returns {string} Formatted rate string
 */
export function formatRate(rate, windowMs) {
	const ratePerSecond = rate * 1000;
	const ratePerMinute = rate * 60000;
	
	if (windowMs <= 1000) {
		return `${ratePerSecond.toFixed(2)} req/s`;
	} else if (windowMs <= 60000) {
		return `${ratePerMinute.toFixed(2)} req/min`;
	} else {
		const ratePerWindow = rate * windowMs;
		const windowSeconds = windowMs / 1000;

		return `${ratePerWindow.toFixed(2)} req/${windowSeconds}s`;
	}
}

/**
 * Create a no-op logger that does nothing (for performance)
 * @returns {object} No-op logger instance
 */
export function createNoOpLogger() {
	const noop = () => {};
	
	return {
		log: noop,
		error: noop,
		warn: noop,
		debug: noop,
		timing: noop,
		config: noop,
		lifecycle: noop,
		isVerboseEnabled: () => false
	};
}