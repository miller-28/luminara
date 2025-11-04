/**
 * Time module for tracking response time metrics
 */

import { createTimeSchema, mergeTime } from "../query/schemas.js";
import { Rolling60sWindow } from "../windows/rolling60s.js";
import { SinceResetWindow } from "../windows/sinceReset.js";
import { SinceStartWindow } from "../windows/sinceStart.js";

export class TimeModule {
	constructor() {
		this.windows = {
			"rolling-60s": new Rolling60sWindow(),
			"since-reset": new SinceResetWindow(),
			"since-start": new SinceStartWindow()
		};
	}

	/**
	 * Handle request completion (success or fail) to record timing
	 */
	onRequestSuccess(event) {
		const { id, status, durationMs } = event;
		
		const dataPoint = {
			type: "timing",
			id,
			status,
			durationMs,
			success: true
		};
		
		Object.values(this.windows).forEach(window => window.add(dataPoint));
	}

	onRequestFail(event) {
		const { id, status, errorKind, durationMs } = event;
		
		const dataPoint = {
			type: "timing",
			id,
			status,
			errorKind,
			durationMs,
			success: false
		};
		
		Object.values(this.windows).forEach(window => window.add(dataPoint));
	}

	/**
	 * Record timing data from other events that carry request context
	 */
	recordTiming(requestId, durationMs, context = {}) {
		const dataPoint = {
			type: "timing",
			id: requestId,
			durationMs,
			...context
		};
		
		Object.values(this.windows).forEach(window => window.add(dataPoint));
	}

	/**
	 * Get time metrics for a specific window
	 */
	getMetrics(windowName, filterFn = null) {
		const window = this.windows[windowName];
		if (!window) {
			throw new Error(`Unknown window: ${windowName}`);
		}
		
		const data = filterFn ? window.getFiltered(filterFn) : window.getData();
		const timings = data
			.filter(point => point.type === "timing" && typeof point.durationMs === "number")
			.map(point => point.durationMs);
		
		return this._calculateTimeMetrics(timings);
	}

	/**
	 * Reset time data for since-reset window
	 */
	reset() {
		this.windows["since-reset"].reset();
	}

	/**
	 * Get grouped time metrics
	 */
	getGroupedMetrics(windowName, groupByField, filterFn = null) {
		const window = this.windows[windowName];
		if (!window) {
			throw new Error(`Unknown window: ${windowName}`);
		}
		
		const data = filterFn ? window.getFiltered(filterFn) : window.getData();
		const groups = new Map();
		
		// Group timing data points by the specified field
		for (const point of data) {
			if (point.type !== "timing" || typeof point.durationMs !== "number") {
				continue;
			}
			
			let groupKey;
			
			switch (groupByField) {
				case "domain":
					groupKey = point.domain || "unknown";
					break;
				case "method":
					groupKey = point.method || "unknown";
					break;
				case "endpoint":
					groupKey = point.endpoint || "unknown";
					break;
				case "tag":
					const tags = point.tags || [];
					groupKey = tags.length > 0 ? tags[0] : "no-tags";
					break;
				default:
					groupKey = "all";
			}
			
			if (!groups.has(groupKey)) {
				groups.set(groupKey, []);
			}
			groups.get(groupKey).push(point.durationMs);
		}
		
		// Calculate time metrics for each group
		const results = [];
		for (const [key, timings] of groups) {
			const time = this._calculateTimeMetrics(timings);
			results.push({ key, time });
		}
		
		return results;
	}

	/**
	 * Calculate time metrics from raw duration values
	 */
	_calculateTimeMetrics(timings) {
		if (timings.length === 0) {
			return createTimeSchema();
		}
		
		const sorted = timings.slice().sort((a, b) => a - b);
		const len = sorted.length;
		const sum = sorted.reduce((acc, val) => acc + val, 0);
		
		return {
			minMs: sorted[0],
			avgMs: sum / len,
			p50Ms: this._percentile(sorted, 0.5),
			p95Ms: this._percentile(sorted, 0.95),
			p99Ms: this._percentile(sorted, 0.99),
			maxMs: sorted[len - 1]
		};
	}

	/**
	 * Calculate percentile from sorted array
	 */
	_percentile(sortedArray, percentile) {
		if (sortedArray.length === 0) return 0;
		
		const index = (sortedArray.length - 1) * percentile;
		const lower = Math.floor(index);
		const upper = Math.ceil(index);
		
		if (lower === upper) {
			return sortedArray[lower];
		}
		
		const weight = index - lower;
		return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
	}

	/**
	 * Get raw timing data for debugging
	 */
	getRawTimings(windowName, filterFn = null) {
		const window = this.windows[windowName];
		if (!window) {
			throw new Error(`Unknown window: ${windowName}`);
		}
		
		const data = filterFn ? window.getFiltered(filterFn) : window.getData();
		return data
			.filter(point => point.type === "timing" && typeof point.durationMs === "number")
			.map(point => ({
				id: point.id,
				durationMs: point.durationMs,
				timestamp: point.timestamp,
				success: point.success
			}));
	}
}