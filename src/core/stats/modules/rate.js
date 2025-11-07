/**
 * Rate module for tracking request rate metrics (RPS/RPM)
 */

import { createRateSchema } from '../query/schemas.js';
import { Rolling60sWindow } from '../windows/rolling60s.js';
import { SinceResetWindow } from '../windows/sinceReset.js';
import { SinceStartWindow } from '../windows/sinceStart.js';

export class RateModule {
	
	constructor() {
		this.windows = {
			'rolling-60s': new Rolling60sWindow(),
			'since-reset': new SinceResetWindow(),
			'since-start': new SinceStartWindow()
		};
		
		// EMA (Exponential Moving Average) state for smooth rate calculation
		this.emaState = {
			lastUpdate: Date.now(),
			currentRps: 0,
			smoothingFactor: 2 / (30 + 1) // 30-second EMA
		};
	}

	/**
	 * Handle request start events to track rate
	 */
	onRequestStart(event) {
		const { id, domain, method, endpoint, tags } = event;
		
		const dataPoint = {
			type: 'request-start',
			id,
			domain,
			method,
			endpoint,
			tags: tags || []
		};
		
		Object.values(this.windows).forEach(window => window.add(dataPoint));
		this._updateEma();
	}

	/**
	 * Get rate metrics for a specific window
	 */
	getMetrics(windowName, mode = 'ema-30s', filterFn = null) {
		const window = this.windows[windowName];
		if (!window) {
			throw new Error(`Unknown window: ${windowName}`);
		}
		
		if (mode === 'ema-30s') {
			return this._getEmaRate();
		} else if (mode === 'tumbling-60s') {
			return this._getTumblingRate(windowName, filterFn);
		}
		
		throw new Error(`Unknown rate mode: ${mode}`);
	}

	/**
	 * Reset rate data for since-reset window
	 */
	reset() {
		this.windows['since-reset'].reset();
		this._resetEma();
	}

	/**
	 * Get grouped rate metrics
	 */
	getGroupedMetrics(windowName, groupByField, mode = 'ema-30s', filterFn = null) {
		const window = this.windows[windowName];
		if (!window) {
			throw new Error(`Unknown window: ${windowName}`);
		}
		
		if (mode === 'ema-30s') {

			// For EMA, we calculate global rate then distribute by group
			return this._getGroupedEmaRate(windowName, groupByField, filterFn);
		} else if (mode === 'tumbling-60s') {
			return this._getGroupedTumblingRate(windowName, groupByField, filterFn);
		}
		
		throw new Error(`Unknown rate mode: ${mode}`);
	}

	/**
	 * Get EMA-based rate (exponential moving average over 30 seconds)
	 */
	_getEmaRate() {
		this._updateEma();

		return createRateSchema('ema-30s');
	}

	/**
	 * Get tumbling window rate (requests in last 60 seconds / 60)
	 */
	_getTumblingRate(windowName, filterFn = null) {
		const window = this.windows[windowName];
		const data = filterFn ? window.getFiltered(filterFn) : window.getData();
		
		const requestStarts = data.filter(point => point.type === 'request-start');
		const timespan = this._getWindowTimespan(windowName);
		
		const rps = timespan > 0 ? (requestStarts.length / (timespan / 1000)) : 0;
		const rpm = rps * 60;
		
		return {
			rps: Math.round(rps * 100) / 100, // Round to 2 decimal places
			rpm: Math.round(rpm * 100) / 100,
			mode: 'tumbling-60s'
		};
	}

	/**
	 * Get grouped EMA rate
	 */
	_getGroupedEmaRate(windowName, groupByField, filterFn = null) {

		// For EMA, we provide the current global rate for each group
		// This is simplified - a more sophisticated implementation would
		// maintain separate EMA state per group
		const globalRate = this._getEmaRate();
		
		const window = this.windows[windowName];
		const data = filterFn ? window.getFiltered(filterFn) : window.getData();
		const groups = this._groupDataPoints(data, groupByField);
		
		const results = [];
		for (const [key] of groups) {
			results.push({ key, rate: globalRate });
		}
		
		return results;
	}

	/**
	 * Get grouped tumbling rate
	 */
	_getGroupedTumblingRate(windowName, groupByField, filterFn = null) {
		const window = this.windows[windowName];
		const data = filterFn ? window.getFiltered(filterFn) : window.getData();
		const groups = this._groupDataPoints(data, groupByField);
		const timespan = this._getWindowTimespan(windowName);
		
		const results = [];
		for (const [key, groupData] of groups) {
			const requestStarts = groupData.filter(point => point.type === 'request-start');
			const rps = timespan > 0 ? (requestStarts.length / (timespan / 1000)) : 0;
			const rpm = rps * 60;
			
			results.push({
				key,
				rate: {
					rps: Math.round(rps * 100) / 100,
					rpm: Math.round(rpm * 100) / 100,
					mode: 'tumbling-60s'
				}
			});
		}
		
		return results;
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
	 * Update EMA calculation
	 */
	_updateEma() {
		const now = Date.now();
		const timeDelta = (now - this.emaState.lastUpdate) / 1000; // seconds
		
		if (timeDelta > 0) {

			// Decay the EMA based on time elapsed
			const decay = Math.exp(-timeDelta / 30); // 30-second half-life
			this.emaState.currentRps *= decay;
			this.emaState.lastUpdate = now;
		}
		
		// Add current request to EMA
		this.emaState.currentRps += this.emaState.smoothingFactor;
	}

	/**
	 * Reset EMA state
	 */
	_resetEma() {
		this.emaState.lastUpdate = Date.now();
		this.emaState.currentRps = 0;
	}

	/**
	 * Get timespan for a window in milliseconds
	 */
	_getWindowTimespan(windowName) {
		const window = this.windows[windowName];
		const stats = window.getStats();

		return stats.timespan;
	}

	/**
	 * Get current EMA rate value (for debugging)
	 */
	getCurrentEmaRate() {
		this._updateEma();

		return {
			rps: this.emaState.currentRps,
			rpm: this.emaState.currentRps * 60,
			lastUpdate: this.emaState.lastUpdate
		};
	}

}