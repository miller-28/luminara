/**
 * Verbose Logger for Debouncer Feature
 * Only logs when verbose mode is enabled globally
 */

/**
 * Create verbose logger for debouncer
 * @param {string} featureName - Name of the feature (e.g., 'Debouncer')
 * @returns {Object} Logger instance with log method
 */
export function createVerboseLogger(featureName) {
	return {
		/**
		 * Log debouncer activity
		 * @param {string} action - Action being performed
		 * @param {Object} details - Details about the action
		 */
		log(action, details) {
			const { method, url, ...rest } = details;
			
			// Determine emoji based on action
			let emoji = '🔄';
			if (action.includes('Cancelled')) {
				emoji = '🚫';
			} else if (action.includes('Executing')) {
				emoji = '✅';
			} else if (action.includes('excluded') || action.includes('disabled')) {
				emoji = '⏭️';
			}
			
			console.info(
				`${emoji} [${featureName}] ${action}:`,
				`${method} ${url}`,
				rest
			);
		}
	};
}
