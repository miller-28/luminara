/**
 * Query engine for executing stats queries with filtering, grouping, and limiting
 */

import { METRIC_TYPES, GROUP_BY_DIMENSIONS, TIME_WINDOWS } from './schemas.js';
import { createFilterFunction, applyLimit } from './selectors.js';

export class QueryEngine {
	
	constructor(modules) {
		this.modules = modules;
	}

	/**
	 * Execute a unified query across multiple metrics
	 */
	query(options = {}) {
		const {
			metrics = ['counters'],
			groupBy = 'none',
			window = 'since-start',
			where = {},
			limit = null
		} = options;

		// Validate inputs
		this._validateQuery(metrics, groupBy, window);

		// Create filter function from where criteria
		const filterFn = createFilterFunction(where);

		// Execute query based on groupBy
		if (groupBy === 'none') {
			return this._executeGlobalQuery(metrics, window, filterFn);
		} else {
			return this._executeGroupedQuery(metrics, groupBy, window, filterFn, limit);
		}
	}

	/**
	 * Execute global query (no grouping)
	 */
	_executeGlobalQuery(metrics, window, filterFn) {
		const result = {
			timestamp: new Date().toISOString(),
			window,
			groups: [
				{
					key: 'all',
					...this._collectMetricsForGroup(metrics, window, filterFn)
				}
			]
		};

		return result;
	}

	/**
	 * Execute grouped query
	 */
	_executeGroupedQuery(metrics, groupBy, window, filterFn, limit) {
		const result = {
			timestamp: new Date().toISOString(),
			window,
			groups: []
		};

		// For grouped queries, we need to get metrics from each module
		// and merge results by group key
		const groupResults = new Map();

		for (const metricType of metrics) {
			const module = this.modules[metricType];
			if (!module) {
				continue;
			}

			// Handle rate module's different signature
			let groupedMetrics;
			if (metricType === 'rate') {
				groupedMetrics = module.getGroupedMetrics(window, groupBy, 'ema-30s', filterFn);
			} else {
				groupedMetrics = module.getGroupedMetrics(window, groupBy, filterFn);
			}
			
			for (const { key, [metricType]: metricData } of groupedMetrics) {
				if (!groupResults.has(key)) {
					groupResults.set(key, { key });
				}
				
				groupResults.get(key)[metricType] = metricData;
			}
		}

		// Convert to array and apply limit
		result.groups = Array.from(groupResults.values());
		result.groups = applyLimit(result.groups, limit);

		return result;
	}

	/**
	 * Collect metrics for a single group (used in global queries)
	 */
	_collectMetricsForGroup(metrics, window, filterFn) {
		const groupMetrics = {};

		for (const metricType of metrics) {
			const module = this.modules[metricType];
			if (module) {

				// Handle rate module's different signature
				if (metricType === 'rate') {
					groupMetrics[metricType] = module.getMetrics(window, 'ema-30s', filterFn);
				} else {
					groupMetrics[metricType] = module.getMetrics(window, filterFn);
				}
			}
		}

		return groupMetrics;
	}

	/**
	 * Validate query parameters
	 */
	_validateQuery(metrics, groupBy, window) {

		// Validate metrics
		if (!Array.isArray(metrics) || metrics.length === 0) {
			throw new Error('Metrics must be a non-empty array');
		}

		for (const metric of metrics) {
			if (!METRIC_TYPES.includes(metric)) {
				throw new Error(`Unknown metric type: ${metric}. Supported: ${METRIC_TYPES.join(', ')}`);
			}
		}

		// Validate groupBy
		if (!GROUP_BY_DIMENSIONS.includes(groupBy)) {
			throw new Error(`Unknown groupBy dimension: ${groupBy}. Supported: ${GROUP_BY_DIMENSIONS.join(', ')}`);
		}

		// Validate window
		if (!TIME_WINDOWS.includes(window)) {
			throw new Error(`Unknown time window: ${window}. Supported: ${TIME_WINDOWS.join(', ')}`);
		}
	}

	/**
	 * Get snapshot of all metrics for all groups (debugging utility)
	 */
	snapshot() {
		return this.query({
			metrics: METRIC_TYPES,
			groupBy: 'none',
			window: 'since-start'
		});
	}

	/**
	 * Reset all modules (for since-reset window)
	 */
	reset() {
		for (const module of Object.values(this.modules)) {
			if (module.reset) {
				module.reset();
			}
		}
	}

	/**
	 * Get available metric types
	 */
	getAvailableMetrics() {
		return METRIC_TYPES.slice();
	}

	/**
	 * Get available groupBy dimensions
	 */
	getAvailableGroupByDimensions() {
		return GROUP_BY_DIMENSIONS.slice();
	}

	/**
	 * Get available time windows
	 */
	getAvailableTimeWindows() {
		return TIME_WINDOWS.slice();
	}

	/**
	 * Validate where criteria structure
	 */
	validateWhereClause(where) {
		if (!where || typeof where !== 'object') {
			return true;
		}

		const validFields = ['domain', 'endpointPrefix', 'method', 'tag'];
		const providedFields = Object.keys(where);

		for (const field of providedFields) {
			if (!validFields.includes(field)) {
				throw new Error(`Unknown where field: ${field}. Supported: ${validFields.join(', ')}`);
			}
		}

		return true;
	}

	/**
	 * Get query execution statistics
	 */
	getQueryStats() {
		const stats = {
			timestamp: new Date().toISOString(),
			modules: {},
			windows: {}
		};

		// Get stats from each module
		for (const [name, module] of Object.entries(this.modules)) {
			if (module.windows) {
				stats.modules[name] = {};
				for (const [windowName, window] of Object.entries(module.windows)) {
					stats.modules[name][windowName] = window.getStats();
				}
			}
		}

		return stats;
	}

}