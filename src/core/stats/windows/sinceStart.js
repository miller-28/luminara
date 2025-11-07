/**
 * Since-start time window implementation
 * Accumulates data from process start until now
 */

export class SinceStartWindow {
	
	constructor() {
		this.data = [];
		this.startTime = Date.now();
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
	 * Get all data points since start
	 */
	getData() {
		return this.data.slice(); // Return a copy
	}

	/**
	 * Get data points matching a filter function
	 */
	getFiltered(filterFn) {
		return this.data.filter(filterFn);
	}

	/**
	 * Get the process start time
	 */
	getStartTime() {
		return this.startTime;
	}

	/**
	 * Get statistics about the window
	 */
	getStats() {
		const now = Date.now();

		return {
			totalPoints: this.data.length,
			timespan: now - this.startTime,
			startTime: this.startTime,
			oldestPoint: this.data.length > 0 ? this.data[0].timestamp : null,
			newestPoint: this.data.length > 0 ? this.data[this.data.length - 1].timestamp : null
		};
	}

	/**
	 * Clear all data (for internal use, doesn't change start time)
	 */
	clear() {
		this.data = [];
	}

	/**
	 * This window type doesn't support reset - it's always since process start
	 * This method exists for interface compatibility but does nothing
	 */
	reset() {

		// Since-start window doesn't support reset
		// Data accumulates from process start
	}
}