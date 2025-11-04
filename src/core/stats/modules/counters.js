/**
 * Counters module for tracking request counts and states
 */

import { createCountersSchema, mergeCounters } from "../query/schemas.js";
import { Rolling60sWindow } from "../windows/rolling60s.js";
import { SinceResetWindow } from "../windows/sinceReset.js";
import { SinceStartWindow } from "../windows/sinceStart.js";

export class CountersModule {
	constructor() {
		this.windows = {
			"rolling-60s": new Rolling60sWindow(),
			"since-reset": new SinceResetWindow(),
			"since-start": new SinceStartWindow()
		};
		
		// Track current in-flight requests
		this.inflightRequests = new Set();
	}

	/**
	 * Handle request lifecycle events
	 */
	onRequestStart(event) {
		const { id, domain, method, endpoint, tags } = event;
		
		this.inflightRequests.add(id);
		
		const dataPoint = {
			type: "request-start",
			id,
			domain,
			method,
			endpoint,
			tags: tags || []
		};
		
		// Add to all windows
		Object.values(this.windows).forEach(window => window.add(dataPoint));
	}

	onRequestSuccess(event) {
		const { id, status, durationMs } = event;
		
		this.inflightRequests.delete(id);
		
		const dataPoint = {
			type: "request-success",
			id,
			status,
			durationMs
		};
		
		Object.values(this.windows).forEach(window => window.add(dataPoint));
	}

	onRequestFail(event) {
		const { id, status, errorKind, durationMs } = event;
		
		this.inflightRequests.delete(id);
		
		const dataPoint = {
			type: "request-fail",
			id,
			status,
			errorKind,
			durationMs
		};
		
		Object.values(this.windows).forEach(window => window.add(dataPoint));
	}

	onRequestRetry(event) {
		const { id, attempt, backoffMs } = event;
		
		const dataPoint = {
			type: "request-retry",
			id,
			attempt,
			backoffMs
		};
		
		Object.values(this.windows).forEach(window => window.add(dataPoint));
	}

	onRequestAbort(event) {
		const { id } = event;
		
		this.inflightRequests.delete(id);
		
		const dataPoint = {
			type: "request-abort",
			id
		};
		
		Object.values(this.windows).forEach(window => window.add(dataPoint));
	}

	/**
	 * Get counter metrics for a specific window
	 */
	getMetrics(windowName, filterFn = null) {
		const window = this.windows[windowName];
		if (!window) {
			throw new Error(`Unknown window: ${windowName}`);
		}
		
		const data = filterFn ? window.getFiltered(filterFn) : window.getData();
		
		const counters = createCountersSchema();
		const requestStarts = new Set();
		const retryRequests = new Set();
		
		for (const point of data) {
			switch (point.type) {
				case "request-start":
					if (!requestStarts.has(point.id)) {
						counters.total++;
						requestStarts.add(point.id);
					}
					break;
				
				case "request-success":
					counters.success++;
					break;
				
				case "request-fail":
					counters.fail++;
					break;
				
				case "request-retry":
					if (!retryRequests.has(point.id)) {
						counters.retried++;
						retryRequests.add(point.id);
					}
					break;
				
				case "request-abort":
					counters.aborted++;
					break;
			}
		}
		
		// Add current in-flight count
		counters.inflight = this.inflightRequests.size;
		
		return counters;
	}

	/**
	 * Reset counters for since-reset window
	 */
	reset() {
		this.windows["since-reset"].reset();
	}

	/**
	 * Get grouped metrics
	 */
	getGroupedMetrics(windowName, groupByField, filterFn = null) {
		const window = this.windows[windowName];
		if (!window) {
			throw new Error(`Unknown window: ${windowName}`);
		}
		
		const data = filterFn ? window.getFiltered(filterFn) : window.getData();
		const groups = new Map();
		
		// Group data points by the specified field
		for (const point of data) {
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
					// For tags, create a group for each tag
					const tags = point.tags || [];
					if (tags.length === 0) {
						groupKey = "no-tags";
					} else {
						// For simplicity, use first tag as group key
						groupKey = tags[0];
					}
					break;
				default:
					groupKey = "all";
			}
			
			if (!groups.has(groupKey)) {
				groups.set(groupKey, []);
			}
			groups.get(groupKey).push(point);
		}
		
		// Calculate metrics for each group
		const results = [];
		for (const [key, groupData] of groups) {
			const counters = this._calculateCountersFromData(groupData);
			results.push({ key, counters });
		}
		
		return results;
	}

	/**
	 * Calculate counters from raw data points
	 */
	_calculateCountersFromData(dataPoints) {
		const counters = createCountersSchema();
		const requestStarts = new Set();
		const retryRequests = new Set();
		
		for (const point of dataPoints) {
			switch (point.type) {
				case "request-start":
					if (!requestStarts.has(point.id)) {
						counters.total++;
						requestStarts.add(point.id);
					}
					break;
				
				case "request-success":
					counters.success++;
					break;
				
				case "request-fail":
					counters.fail++;
					break;
				
				case "request-retry":
					if (!retryRequests.has(point.id)) {
						counters.retried++;
						retryRequests.add(point.id);
					}
					break;
				
				case "request-abort":
					counters.aborted++;
					break;
			}
		}
		
		return counters;
	}
}