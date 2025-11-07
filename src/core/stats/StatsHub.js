/**
 * StatsHub - Main entry point for Luminara stats system
 * Provides unified query interface and namespaced helpers
 */

import { CountersModule } from "./modules/counters.js";
import { TimeModule } from "./modules/time.js";
import { RateModule } from "./modules/rate.js";
import { RetryModule } from "./modules/retry.js";
import { ErrorModule } from "./modules/error.js";
import { QueryEngine } from "./query/queryEngine.js";
import { extractRequestMetadata } from "./query/selectors.js";
import { statsLogger } from "./verboseLogger.js";

export class StatsHub {
	
	constructor() {
		// Initialize metric modules
		this.modules = {
			counters: new CountersModule(),
			time: new TimeModule(),
			rate: new RateModule(),
			retry: new RetryModule(),
			error: new ErrorModule()
		};

		// Initialize query engine
		this.queryEngine = new QueryEngine(this.modules);

		// Event listeners for updates
		this.updateListeners = new Set();

		// Request tracking for cross-module coordination
		this.activeRequests = new Map();
		
		// Verbose logging state (can be set by Luminara client)
		this.verboseEnabled = false;
	}
	
	/**
	 * Enable/disable verbose logging for stats operations
	 */
	setVerbose(enabled) {
		this.verboseEnabled = enabled;
	}
	
	/**
	 * Create context for verbose logging
	 */
	_createVerboseContext() {
		return {
			req: {
				verbose: this.verboseEnabled
			}
		};
	}

	/**
	 * Unified query interface
	 */
	query(options = {}) {
		const result = this.queryEngine.query(options);
		
		// Log query if verbose is enabled
		if (this.verboseEnabled) {

		}
		
		return result;
	}

	/**
	 * Point-in-time snapshot of all metrics
	 */
	snapshot() {
		const result = this.queryEngine.snapshot();
		
		// Log snapshot operation if verbose is enabled
		if (this.verboseEnabled) {
			logStatsOperation(this._createVerboseContext(), 'snapshot', {
				timestamp: result.timestamp,
				groupCount: result.groups ? result.groups.length : 0
			});
		}
		
		return result;
	}

	/**
	 * Reset all stats (since-reset window)
	 */
	reset() {
		this.queryEngine.reset();
		this.activeRequests.clear();
		this._notifyUpdateListeners("reset");
		
		// Log reset operation if verbose is enabled
		if (this.verboseEnabled) {
			logStatsOperation(this._createVerboseContext(), 'reset', {
				timestamp: Date.now(),
				scope: 'all'
			});
		}
	}

	/**
	 * Namespaced helper: counters
	 */
	get counters() {
		return {
			get: (options = {}) => {
				const { groupBy = "none", window = "since-reset", where, limit } = options;
				
				if (groupBy === "none") {
					return this.modules.counters.getMetrics(window, where ? this._createFilterFn(where) : null);
				} else {
					const results = this.modules.counters.getGroupedMetrics(window, groupBy, where ? this._createFilterFn(where) : null);
					return this._applyLimit(results, limit);
				}
			},
			reset: () => {
				this.modules.counters.reset();
				this._notifyUpdateListeners("counters.reset");
				
				// Log module reset if verbose is enabled
				if (this.verboseEnabled) {
					logModuleActivity(this._createVerboseContext(), 'counters', 'reset', {
						timestamp: Date.now()
					});
				}
			}
		};
	}

	/**
	 * Namespaced helper: time
	 */
	get time() {
		return {
			get: (options = {}) => {
				const { groupBy = "none", window = "since-reset", where, limit } = options;
				
				if (groupBy === "none") {
					return this.modules.time.getMetrics(window, where ? this._createFilterFn(where) : null);
				} else {
					const results = this.modules.time.getGroupedMetrics(window, groupBy, where ? this._createFilterFn(where) : null);
					return this._applyLimit(results, limit);
				}
			},
			reset: () => {
				this.modules.time.reset();
				this._notifyUpdateListeners("time.reset");
				
				// Log module reset if verbose is enabled
				if (this.verboseEnabled) {
					logModuleActivity(this._createVerboseContext(), 'time', 'reset', {
						timestamp: Date.now()
					});
				}
			}
		};
	}

	/**
	 * Namespaced helper: rate
	 */
	get rate() {
		return {
			get: (options = {}) => {
				const { groupBy = "none", window = "since-reset", where, limit, mode = "ema-30s" } = options;
				
				if (groupBy === "none") {
					return this.modules.rate.getMetrics(window, mode, where ? this._createFilterFn(where) : null);
				} else {
					const results = this.modules.rate.getGroupedMetrics(window, groupBy, mode, where ? this._createFilterFn(where) : null);
					return this._applyLimit(results, limit);
				}
			},
			reset: () => {
				this.modules.rate.reset();
				this._notifyUpdateListeners("rate.reset");
				
				// Log module reset if verbose is enabled
				if (this.verboseEnabled) {
					logModuleActivity(this._createVerboseContext(), 'rate', 'reset', {
						timestamp: Date.now()
					});
				}
			}
		};
	}

	/**
	 * Namespaced helper: retry
	 */
	get retry() {
		return {
			get: (options = {}) => {
				const { groupBy = "none", window = "since-reset", where, limit } = options;
				
				if (groupBy === "none") {
					return this.modules.retry.getMetrics(window, where ? this._createFilterFn(where) : null);
				} else {
					const results = this.modules.retry.getGroupedMetrics(window, groupBy, where ? this._createFilterFn(where) : null);
					return this._applyLimit(results, limit);
				}
			},
			reset: () => {
				this.modules.retry.reset();
				this._notifyUpdateListeners("retry.reset");
				
				// Log module reset if verbose is enabled
				if (this.verboseEnabled) {
					logModuleActivity(this._createVerboseContext(), 'retry', 'reset', {
						timestamp: Date.now()
					});
				}
			}
		};
	}

	/**
	 * Namespaced helper: error
	 */
	get error() {
		return {
			get: (options = {}) => {
				const { groupBy = "none", window = "since-reset", where, limit } = options;
				
				if (groupBy === "none") {
					return this.modules.error.getMetrics(window, where ? this._createFilterFn(where) : null);
				} else {
					const results = this.modules.error.getGroupedMetrics(window, groupBy, where ? this._createFilterFn(where) : null);
					return this._applyLimit(results, limit);
				}
			},
			reset: () => {
				this.modules.error.reset();
				this._notifyUpdateListeners("error.reset");
				
				// Log module reset if verbose is enabled
				if (this.verboseEnabled) {
					logModuleActivity(this._createVerboseContext(), 'error', 'reset', {
						timestamp: Date.now()
					});
				}
			}
		};
	}

	/**
	 * Event listener for stats updates
	 */
	on(event, listener) {
		if (event === "update") {
			this.updateListeners.add(listener);
			return () => this.updateListeners.delete(listener);
		}
		
		throw new Error(`Unknown event type: ${event}`);
	}

	/**
	 * Handle driver lifecycle events
	 */
	onRequestStart(event) {
		const enrichedEvent = this._enrichEvent(event);
		const requestId = enrichedEvent.id;
		
		// Store request metadata for cross-module use
		this.activeRequests.set(requestId, {
			...enrichedEvent,
			startTime: Date.now()
		});

		// Notify all modules
		this.modules.counters.onRequestStart(enrichedEvent);
		this.modules.rate.onRequestStart(enrichedEvent);
		
		this._notifyUpdateListeners("request.start", enrichedEvent);
	}

	onRequestSuccess(event) {
		const { id } = event;
		const requestData = this.activeRequests.get(id);
		
		if (requestData) {
			const enrichedEvent = {
				...event,
				...requestData,
				durationMs: event.durationMs || (Date.now() - requestData.startTime)
			};

			// Notify modules and log updates if verbose is enabled
			this.modules.counters.onRequestSuccess(enrichedEvent);
			if (this.verboseEnabled) {
				const countersData = this.modules.counters.getMetrics('since-start');

			}
			
			this.modules.time.onRequestSuccess(enrichedEvent);
			if (this.verboseEnabled) {
				const timeData = this.modules.time.getMetrics('since-start');

			}
			
			this.modules.retry.onRequestSuccess(enrichedEvent);
			if (this.verboseEnabled) {
				const retryData = this.modules.retry.getMetrics('since-start');

			}
			
			this.activeRequests.delete(id);
			this._notifyUpdateListeners("request.success", enrichedEvent);
		}
	}

	onRequestFail(event) {
		const { id } = event;
		const requestData = this.activeRequests.get(id);
		
		if (requestData) {
			const enrichedEvent = {
				...event,
				...requestData,
				durationMs: event.durationMs || (Date.now() - requestData.startTime)
			};

			// Notify modules and log updates if verbose is enabled
			this.modules.counters.onRequestFail(enrichedEvent);
			if (this.verboseEnabled) {
				const countersData = this.modules.counters.getMetrics('since-start');

			}
			
			this.modules.time.onRequestFail(enrichedEvent);
			if (this.verboseEnabled) {
				const timeData = this.modules.time.getMetrics('since-start');

			}
			
			this.modules.retry.onRequestFail(enrichedEvent);
			if (this.verboseEnabled) {
				const retryData = this.modules.retry.getMetrics('since-start');

			}
			
			this.modules.error.onRequestFail(enrichedEvent);
			if (this.verboseEnabled) {
				const errorData = this.modules.error.getMetrics('since-start');

			}
			
			this.activeRequests.delete(id);
			this._notifyUpdateListeners("request.fail", enrichedEvent);
		}
	}

	onRequestRetry(event) {
		const { id } = event;
		const requestData = this.activeRequests.get(id);
		
		if (requestData) {
			const enrichedEvent = {
				...event,
				...requestData
			};

			// Notify modules
			this.modules.counters.onRequestRetry(enrichedEvent);
			this.modules.retry.onRequestRetry(enrichedEvent);
			
			this._notifyUpdateListeners("request.retry", enrichedEvent);
		}
	}

	onRequestAbort(event) {
		const { id } = event;
		const requestData = this.activeRequests.get(id);
		
		if (requestData) {
			const enrichedEvent = {
				...event,
				...requestData
			};

			// Notify modules
			this.modules.counters.onRequestAbort(enrichedEvent);
			this.modules.error.onRequestAbort(enrichedEvent);
			
			this.activeRequests.delete(id);
			this._notifyUpdateListeners("request.abort", enrichedEvent);
		}
	}

	/**
	 * Enrich event with extracted metadata
	 */
	_enrichEvent(event) {
		const metadata = extractRequestMetadata(event);
		return { ...event, ...metadata };
	}

	/**
	 * Create filter function from where criteria
	 */
	_createFilterFn(where) {
		return (dataPoint) => {
			if (where.domain && dataPoint.domain !== where.domain) return false;
			if (where.method && dataPoint.method !== where.method) return false;
			if (where.endpointPrefix && !dataPoint.endpoint?.startsWith(where.endpointPrefix)) return false;
			if (where.tag && !dataPoint.tags?.includes(where.tag)) return false;
			return true;
		};
	}

	/**
	 * Apply limit to results array
	 */
	_applyLimit(results, limit) {
		if (!limit || limit <= 0) return results;
		return results.slice(0, limit);
	}

	/**
	 * Notify update listeners
	 */
	_notifyUpdateListeners(type, data = null) {
		for (const listener of this.updateListeners) {
			try {
				listener({ type, data, timestamp: Date.now() });
			} catch (error) {
				console.warn("Error in stats update listener:", error);
			}
		}
	}

	/**
	 * Get system information and diagnostics
	 */
	getSystemInfo() {
		return {
			timestamp: new Date().toISOString(),
			activeRequests: this.activeRequests.size,
			updateListeners: this.updateListeners.size,
			modules: Object.keys(this.modules),
			queryStats: this.queryEngine.getQueryStats()
		};
	}

	/**
	 * Export all stats data (for debugging/analysis)
	 */
	exportData() {
		const data = {
			timestamp: new Date().toISOString(),
			snapshot: this.snapshot(),
			systemInfo: this.getSystemInfo(),
			activeRequests: Array.from(this.activeRequests.entries())
		};

		return data;
	}
}
