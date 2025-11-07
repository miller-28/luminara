/**
 * Since-reset time window implementation
 * Accumulates data from the last reset point until now
 */

export class SinceResetWindow {
	
	constructor() {
		this.data = [];
		this.resetTime = Date.now();
	}

	/**
	 * Add a data point to the window
	 */
	add(dataPoint) {
		this.data.push({
			...dataPoint,
			timestamp: Date.now()
		});
	}

	/**
	 * Get all data points since last reset
	 */
	getData() {
		return this.data.slice(); // Return a copy
	}

	/**
	 * Reset the window, clearing all data
	 */
	reset() {
		this.data = [];
		this.resetTime = Date.now();
	}

	/**
	 * Get data points matching a filter function
	 */
	getFiltered(filterFn) {
		return this.data.filter(filterFn);
	}

	/**
	 * Get the time when window was last reset
	 */
	getResetTime() {
		return this.resetTime;
	}

	/**
	 * Get statistics about the window
	 */
	getStats() {
		const now = Date.now();
		return {
			totalPoints: this.data.length,
			timespan: now - this.resetTime,
			resetTime: this.resetTime,
			oldestPoint: this.data.length > 0 ? this.data[0].timestamp : null,
			newestPoint: this.data.length > 0 ? this.data[this.data.length - 1].timestamp : null
		};
	}

	/**
	 * Clear all data without changing reset time (for internal use)
	 */
	clear() {
		this.data = [];
	}
}