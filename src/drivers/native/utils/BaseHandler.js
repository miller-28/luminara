/**
 * BaseHandler - Shared functionality for all handlers
 * Provides stats tracking and verbose logging capabilities
 */

export class BaseHandler {

	constructor(stats = null, verbose = false) {
		this.stats = stats;
		this.verbose = verbose;
	}

	/**
	 * Track event in stats system
	 */
	trackStats(event, data) {
		if (this.stats) {
			this.stats.track(event, data);
		}
	}

	/**
	 * Log verbose information
	 */
	log(context, action, message, data = {}) {
		if (this.verbose && context?.verbose) {

			// Verbose logging handled by individual feature loggers
			// This is a placeholder for handler-level logging
		}
	}

	/**
	 * Create context for verbose logging
	 */
	createContext(config) {
		return {
			verbose: this.verbose,
			...config
		};
	}

}
