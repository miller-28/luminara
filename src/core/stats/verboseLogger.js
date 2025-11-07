/**
 * Stats feature verbose logger
 * Handles detailed logging for stats operations, queries, and module updates
 */

import { BaseVerboseLogger } from '../verbose/BaseVerboseLogger.js';

export class StatsVerboseLogger extends BaseVerboseLogger {
	
	constructor() {
		super('STATS');
	}

	/**
	 * Log stats system initialization
	 */
	logStatsInitialization(context, modules) {
		this.config(context, {
			modules: modules,
			moduleCount: modules?.length || 0
		}, 'Stats system initialized');
	}

	/**
	 * Log stats query operation
	 */
	logStatsQuery(context, queryType, selector, result) {
		this.log(context, 'QUERY', `Stats query: ${queryType}`, {
			queryType: queryType,
			selector: selector,
			resultSize: result ? Object.keys(result).length : 0,
			operation: 'read'
		});
	}

	/**
	 * Log stats reset operation
	 */
	logStatsReset(context, resetScope, affectedModules) {
		this.log(context, 'RESET', `Stats reset: ${resetScope}`, {
			scope: resetScope,
			affectedModules: affectedModules,
			moduleCount: affectedModules?.length || 0,
			operation: 'reset'
		});
	}

	/**
	 * Log stats module update
	 */
	logModuleUpdate(context, moduleName, updateType, data) {
		this.debug(context, 'MODULE_UPDATE', `${moduleName} module updated: ${updateType}`, {
			module: moduleName,
			updateType: updateType,
			data: data,
			timestamp: Date.now()
		});
	}

	/**
	 * Log stats snapshot creation
	 */
	logSnapshotCreation(context, snapshotSize, includeTimestamps) {
		this.log(context, 'SNAPSHOT', 'Stats snapshot created', {
			size: snapshotSize,
			includeTimestamps: includeTimestamps,
			operation: 'snapshot'
		});
	}

	/**
	 * Log request lifecycle event
	 */
	logRequestLifecycle(context, event, requestData) {
		this.debug(context, 'LIFECYCLE', `Request ${event}`, {
			event: event,
			method: requestData?.method,
			url: requestData?.url,
			status: requestData?.status,
			timing: requestData?.timing
		});
	}

	/**
	 * Log stats aggregation operation
	 */
	logStatsAggregation(context, aggregationType, window, result) {
		this.debug(context, 'AGGREGATION', `Stats aggregated: ${aggregationType}`, {
			type: aggregationType,
			window: window,
			resultKeys: result ? Object.keys(result) : [],
			operation: 'aggregate'
		});
	}

	/**
	 * Log stats verbose mode toggle
	 */
	logVerboseModeToggle(context, enabled, source) {
		this.lifecycle(context, 'VERBOSE_MODE', `Verbose logging ${enabled ? 'enabled' : 'disabled'}`, {
			enabled: enabled,
			source: source,
			timestamp: Date.now()
		});
	}

}

// Create singleton instance
const statsLogger = new StatsVerboseLogger();

export { statsLogger };