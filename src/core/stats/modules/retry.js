/**
 * Retry module for tracking retry-related metrics
 */

import { createRetrySchema } from '../query/schemas.js';
import { Rolling60sWindow } from '../windows/rolling60s.js';
import { SinceResetWindow } from '../windows/sinceReset.js';
import { SinceStartWindow } from '../windows/sinceStart.js';

export class RetryModule {
	
	constructor() {
		this.windows = {
			'rolling-60s': new Rolling60sWindow(),
			'since-reset': new SinceResetWindow(),
			'since-start': new SinceStartWindow()
		};
		
		// Track retry sequences per request ID
		this.retrySequences = new Map();
	}

	/**
	 * Handle retry events
	 */
	onRequestRetry(event) {
		const { id, attempt, backoffMs } = event;
		
		const dataPoint = {
			type: 'retry',
			id,
			attempt,
			backoffMs
		};
		
		Object.values(this.windows).forEach(window => window.add(dataPoint));
		
		// Track retry sequence
		if (!this.retrySequences.has(id)) {
			this.retrySequences.set(id, {
				attempts: [],
				outcome: null
			});
		}
		
		this.retrySequences.get(id).attempts.push({
			attempt,
			backoffMs,
			timestamp: Date.now()
		});
	}

	/**
	 * Handle request success after retries
	 */
	onRequestSuccess(event) {
		const { id } = event;
		
		if (this.retrySequences.has(id)) {
			this.retrySequences.get(id).outcome = 'success';
			
			const dataPoint = {
				type: 'retry-outcome',
				id,
				outcome: 'success',
				totalAttempts: this.retrySequences.get(id).attempts.length
			};
			
			Object.values(this.windows).forEach(window => window.add(dataPoint));
		}
	}

	/**
	 * Handle request failure (giving up after max retries)
	 */
	onRequestFail(event) {
		const { id } = event;
		
		if (this.retrySequences.has(id)) {
			this.retrySequences.get(id).outcome = 'giveup';
			
			const dataPoint = {
				type: 'retry-outcome',
				id,
				outcome: 'giveup',
				totalAttempts: this.retrySequences.get(id).attempts.length
			};
			
			Object.values(this.windows).forEach(window => window.add(dataPoint));
		}
	}

	/**
	 * Clean up completed retry sequences
	 */
	cleanupRetrySequence(requestId) {
		this.retrySequences.delete(requestId);
	}

	/**
	 * Get retry metrics for a specific window
	 */
	getMetrics(windowName, filterFn = null) {
		const window = this.windows[windowName];
		if (!window) {
			throw new Error(`Unknown window: ${windowName}`);
		}
		
		const data = filterFn ? window.getFiltered(filterFn) : window.getData();

		return this._calculateRetryMetrics(data);
	}

	/**
	 * Reset retry data for since-reset window
	 */
	reset() {
		this.windows['since-reset'].reset();
		this.retrySequences.clear();
	}

	/**
	 * Get grouped retry metrics
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
			const retry = this._calculateRetryMetrics(groupData);
			results.push({ key, retry });
		}
		
		return results;
	}

	/**
	 * Calculate retry metrics from raw data
	 */
	_calculateRetryMetrics(data) {
		const retrySchema = createRetrySchema();
		const retryEvents = data.filter(point => point.type === 'retry');
		const outcomeEvents = data.filter(point => point.type === 'retry-outcome');
		
		// Count total retries
		retrySchema.count = retryEvents.length;
		
		// Calculate backoff statistics
		const backoffTimes = retryEvents
			.filter(event => typeof event.backoffMs === 'number')
			.map(event => event.backoffMs);
		
		if (backoffTimes.length > 0) {
			retrySchema.minBackoffMs = Math.min(...backoffTimes);
			retrySchema.maxBackoffMs = Math.max(...backoffTimes);
			retrySchema.avgBackoffMs = backoffTimes.reduce((sum, val) => sum + val, 0) / backoffTimes.length;
		}
		
		// Calculate success after retry average and giveups
		const successfulRetries = outcomeEvents.filter(event => event.outcome === 'success');
		const giveupRetries = outcomeEvents.filter(event => event.outcome === 'giveup');
		
		if (successfulRetries.length > 0) {
			const totalAttempts = successfulRetries.reduce((sum, event) => sum + event.totalAttempts, 0);
			retrySchema.successAfterAvg = totalAttempts / successfulRetries.length;
		}
		
		retrySchema.giveups = giveupRetries.length;
		
		// Round to reasonable precision
		retrySchema.successAfterAvg = Math.round(retrySchema.successAfterAvg * 100) / 100;
		retrySchema.avgBackoffMs = Math.round(retrySchema.avgBackoffMs);
		
		return retrySchema;
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
	 * Get active retry sequences (for debugging)
	 */
	getActiveRetrySequences() {
		return Array.from(this.retrySequences.entries()).map(([id, sequence]) => ({
			requestId: id,
			attempts: sequence.attempts.length,
			outcome: sequence.outcome,
			lastAttempt: sequence.attempts[sequence.attempts.length - 1]
		}));
	}

	/**
	 * Get retry distribution (attempts per request)
	 */
	getRetryDistribution(windowName, filterFn = null) {
		const window = this.windows[windowName];
		if (!window) {
			throw new Error(`Unknown window: ${windowName}`);
		}
		
		const data = filterFn ? window.getFiltered(filterFn) : window.getData();
		const outcomeEvents = data.filter(point => point.type === 'retry-outcome');
		
		const distribution = {};
		for (const event of outcomeEvents) {
			const attempts = event.totalAttempts;
			distribution[attempts] = (distribution[attempts] || 0) + 1;
		}
		
		return distribution;
	}
}