/**
 * Error module for tracking error-related metrics
 */

import { createErrorSchema, mergeErrors } from '../query/schemas.js';
import { Rolling60sWindow } from '../windows/rolling60s.js';
import { SinceResetWindow } from '../windows/sinceReset.js';
import { SinceStartWindow } from '../windows/sinceStart.js';

export class ErrorModule {
	
	constructor() {
		this.windows = {
			'rolling-60s': new Rolling60sWindow(),
			'since-reset': new SinceResetWindow(),
			'since-start': new SinceStartWindow()
		};
	}

	/**
	 * Handle request failure events
	 */
	onRequestFail(event) {
		const { id, status, errorKind, durationMs } = event;
		
		const dataPoint = {
			type: 'error',
			id,
			status,
			errorKind,
			durationMs,
			errorClass: this._classifyError(status, errorKind)
		};
		
		Object.values(this.windows).forEach(window => window.add(dataPoint));
	}

	/**
	 * Handle request abort events
	 */
	onRequestAbort(event) {
		const { id } = event;
		
		const dataPoint = {
			type: 'error',
			id,
			errorKind: 'aborted',
			errorClass: 'aborted'
		};
		
		Object.values(this.windows).forEach(window => window.add(dataPoint));
	}

	/**
	 * Handle timeout events (if tracked separately)
	 */
	onRequestTimeout(event) {
		const { id, timeoutMs } = event;
		
		const dataPoint = {
			type: 'error',
			id,
			errorKind: 'timeout',
			errorClass: 'timeout',
			timeoutMs
		};
		
		Object.values(this.windows).forEach(window => window.add(dataPoint));
	}

	/**
	 * Get error metrics for a specific window
	 */
	getMetrics(windowName, filterFn = null) {
		const window = this.windows[windowName];
		if (!window) {
			throw new Error(`Unknown window: ${windowName}`);
		}
		
		const data = filterFn ? window.getFiltered(filterFn) : window.getData();

		return this._calculateErrorMetrics(data);
	}

	/**
	 * Reset error data for since-reset window
	 */
	reset() {
		this.windows['since-reset'].reset();
	}

	/**
	 * Get grouped error metrics
	 */
	getGroupedMetrics(windowName, groupByField, filterFn = null) {
		const window = this.windows[windowName];
		if (!window) {
			throw new Error(`Unknown window: ${windowName}`);
		}
		
		const data = filterFn ? window.getFiltered(filterFn) : window.getData();
		const groups = this._groupDataPoints(data, groupByField);
		
		const results = [];
		for (const [key, groupData] of groups) {
			const error = this._calculateErrorMetrics(groupData);
			results.push({ key, error });
		}
		
		return results;
	}

	/**
	 * Calculate error metrics from raw data
	 */
	_calculateErrorMetrics(data) {
		const errorSchema = createErrorSchema();
		const errorEvents = data.filter(point => point.type === 'error');
		const statusCodes = new Map();
		
		for (const event of errorEvents) {

			// Count by error class
			const errorClass = event.errorClass;
			if (errorSchema.byClass.hasOwnProperty(errorClass)) {
				errorSchema.byClass[errorClass]++;
			} else {
				errorSchema.byClass.other++;
			}
			
			// Track status codes
			if (event.status && typeof event.status === 'number') {
				const count = statusCodes.get(event.status) || 0;
				statusCodes.set(event.status, count + 1);
			}
		}
		
		// Generate top error codes
		errorSchema.topCodes = Array.from(statusCodes.entries())
			.map(([code, count]) => ({ code, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 10); // Top 10 error codes
		
		return errorSchema;
	}

	/**
	 * Classify errors into predefined categories
	 */
	_classifyError(status, errorKind) {

		// Handle explicit error kinds first
		if (errorKind === 'timeout') {
			return 'timeout';
		}
		if (errorKind === 'network') {
			return 'network';
		}
		if (errorKind === 'aborted') {
			return 'aborted';
		}
		
		// Classify by HTTP status code
		if (typeof status === 'number') {
			if (status >= 400 && status < 500) {
				return '4xx';
			}
			if (status >= 500 && status < 600) {
				return '5xx';
			}
		}
		
		// Default classification
		return 'other';
	}

	/**
	 * Group data points by field
	 */
	_groupDataPoints(data, groupByField) {
		const groups = new Map();
		
		for (const point of data) {
			let groupKey;
			
			switch (groupByField) {
				case 'domain':
					groupKey = point.domain || 'unknown';
					break;
				case 'method':
					groupKey = point.method || 'unknown';
					break;
				case 'endpoint':
					groupKey = point.endpoint || 'unknown';
					break;
				case 'tag':
					const tags = point.tags || [];
					groupKey = tags.length > 0 ? tags[0] : 'no-tags';
					break;
				default:
					groupKey = 'all';
			}
			
			if (!groups.has(groupKey)) {
				groups.set(groupKey, []);
			}
			groups.get(groupKey).push(point);
		}
		
		return groups;
	}

	/**
	 * Get error rate (errors per total requests) for a window
	 */
	getErrorRate(windowName, filterFn = null) {
		const window = this.windows[windowName];
		if (!window) {
			throw new Error(`Unknown window: ${windowName}`);
		}
		
		const data = filterFn ? window.getFiltered(filterFn) : window.getData();
		const errorEvents = data.filter(point => point.type === 'error');
		const totalRequests = data.filter(point => point.type === 'request-start').length;
		
		return {
			errorCount: errorEvents.length,
			totalRequests,
			errorRate: totalRequests > 0 ? (errorEvents.length / totalRequests) : 0
		};
	}

	/**
	 * Get detailed error breakdown by status code
	 */
	getErrorBreakdown(windowName, filterFn = null) {
		const window = this.windows[windowName];
		if (!window) {
			throw new Error(`Unknown window: ${windowName}`);
		}
		
		const data = filterFn ? window.getFiltered(filterFn) : window.getData();
		const errorEvents = data.filter(point => point.type === 'error');
		
		const breakdown = {
			byStatusCode: new Map(),
			byErrorKind: new Map(),
			byErrorClass: new Map()
		};
		
		for (const event of errorEvents) {

			// By status code
			if (event.status) {
				const statusCount = breakdown.byStatusCode.get(event.status) || 0;
				breakdown.byStatusCode.set(event.status, statusCount + 1);
			}
			
			// By error kind
			if (event.errorKind) {
				const kindCount = breakdown.byErrorKind.get(event.errorKind) || 0;
				breakdown.byErrorKind.set(event.errorKind, kindCount + 1);
			}
			
			// By error class
			if (event.errorClass) {
				const classCount = breakdown.byErrorClass.get(event.errorClass) || 0;
				breakdown.byErrorClass.set(event.errorClass, classCount + 1);
			}
		}
		
		// Convert Maps to objects for easier consumption
		return {
			byStatusCode: Object.fromEntries(breakdown.byStatusCode),
			byErrorKind: Object.fromEntries(breakdown.byErrorKind),
			byErrorClass: Object.fromEntries(breakdown.byErrorClass),
			totalErrors: errorEvents.length
		};
	}
}