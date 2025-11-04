/**
 * Verbose logging system specifically for Luminara Stats feature
 * 
 * This module provides detailed logging of stats events, operations, and data changes
 * when verbose mode is enabled. It integrates with the main Luminara verbose logging
 * system and uses the STATS category with 📊 emoji.
 * 
 * Automatic Integration:
 * - When you create a Luminara client with `verbose: true`, stats verbose logging
 *   is automatically enabled via the main verbose setting
 * - The Luminara client calls `statsInstance.setVerbose(true)` automatically
 * - All stats operations (queries, resets, updates) will log detailed information
 * - Request lifecycle events (start, success, fail, retry, abort) are logged
 * - Module updates (counters, time, rate, retry, error) are logged in real-time
 * 
 * Usage Example:
 * ```javascript
 * const api = createLuminara({
 *   baseURL: 'https://api.example.com',
 *   verbose: true  // This automatically enables stats verbose logging
 * });
 * 
 * // All of these operations will generate verbose logs:
 * await api.get('/data');           // Logs request events + module updates
 * const stats = api.stats().counters.get();  // Logs query operation
 * api.stats().reset();              // Logs reset operation
 * const snapshot = api.stats().snapshot();   // Logs snapshot operation
 * ```
 * 
 * Control Flow:
 * 1. User sets `verbose: true` in createLuminara()
 * 2. Luminara client automatically calls `statsInstance.setVerbose(true)`
 * 3. All stats operations check `this.verboseEnabled` and log accordingly
 * 4. No separate stats verbose setting - controlled by main verbose flag
 * 
 * Console Output Examples:
 * - 📊 [Luminara] STATS: EVENT: Request started - tracking begins (requestId: req_1_123456, method: GET, url: /data)
 * - 📊 [Luminara] STATS: UPDATE: Counters updated (operation: request-success, total: 1, success: 1, fail: 0)
 * - 📊 [Luminara] STATS: QUERY: Stats query executed (metrics: counters, windows: since-start)
 * - 📊 [Luminara] STATS: OPERATION: Stats reset performed (timestamp: 123456789, scope: all)
 * 
 * Verbose Categories:
 * - EVENT: Request lifecycle events (start, success, fail, retry, abort)
 * - UPDATE: Module data updates (counters, time, rate, retry, error changes)
 * - QUERY: Stats queries and their parameters
 * - OPERATION: System operations (reset, snapshot, window updates)
 * - SYSTEM: System lifecycle (enable/disable, instance creation, errors)
 * - MODULE: Module-specific activities and resets
 */

import { verboseLog } from "../verboseLogger.js";

/**
 * Log stats hub events and operations
 * @param {boolean|object} verbose - verbose flag or context with verbose flag
 * @param {string} action - the stats action (e.g., 'EVENT', 'QUERY', 'UPDATE', 'RESET')
 * @param {string} message - descriptive message
 * @param {object} details - optional details object
 */
export function logStats(verbose, action, message, details = null) {
	verboseLog(verbose, 'STATS', `${action}: ${message}`, details);
}

/**
 * Log request lifecycle events for stats tracking
 */
export function logRequestEvent(context, eventType, data) {
	if (!context?.req?.verbose) return;
	
	const baseDetails = {
		requestId: data.requestId,
		method: data.method,
		url: data.url,
		attempt: data.attempt || 1
	};
	
	switch (eventType) {
		case 'request:start':
			logStats(context, 'EVENT', `Request started - tracking begins`, {
				...baseDetails,
				timestamp: data.timestamp,
				hasTimeout: !!data.timeout,
				hasRetry: (data.retry || 0) > 0
			});
			break;
			
		case 'request:success':
			logStats(context, 'EVENT', `Request succeeded - updating success metrics`, {
				...baseDetails,
				status: data.status,
				duration: data.duration,
				totalAttempts: data.attempt,
				timestamp: data.timestamp
			});
			break;
			
		case 'request:fail':
			logStats(context, 'EVENT', `Request failed - updating error metrics`, {
				...baseDetails,
				errorType: data.error?.name || 'unknown',
				errorMessage: data.error?.message || 'unknown',
				status: data.status,
				duration: data.duration,
				totalAttempts: data.attempt,
				timestamp: data.timestamp
			});
			break;
			
		case 'request:retry':
			logStats(context, 'EVENT', `Request retry - incrementing retry metrics`, {
				...baseDetails,
				retryCount: data.retryCount,
				backoffDelay: data.backoffDelay,
				errorType: data.error?.name || 'unknown',
				timestamp: data.timestamp
			});
			break;
			
		case 'request:abort':
			logStats(context, 'EVENT', `Request aborted - updating abort metrics`, {
				...baseDetails,
				reason: data.reason || 'user-initiated',
				duration: data.duration,
				timestamp: data.timestamp
			});
			break;
	}
}

/**
 * Log stats data updates and changes
 */
export function logStatsUpdate(context, module, operation, data) {
	if (!context?.req?.verbose) return;
	
	switch (module) {
		case 'counters':
			logStats(context, 'UPDATE', `Counters updated`, {
				operation,
				total: data.total,
				success: data.success,
				fail: data.fail,
				abort: data.abort
			});
			break;
			
		case 'time':
			logStats(context, 'UPDATE', `Time metrics updated`, {
				operation,
				requests: data.requestCount,
				avgDuration: data.averageDuration ? Math.round(data.averageDuration) : null,
				minDuration: data.minDuration,
				maxDuration: data.maxDuration
			});
			break;
			
		case 'rate':
			logStats(context, 'UPDATE', `Rate metrics updated`, {
				operation,
				window: data.windowType,
				ratePerSecond: data.ratePerSecond ? data.ratePerSecond.toFixed(2) : null,
				ratePerMinute: data.ratePerMinute ? data.ratePerMinute.toFixed(2) : null
			});
			break;
			
		case 'retry':
			logStats(context, 'UPDATE', `Retry metrics updated`, {
				operation,
				totalRetries: data.totalRetries,
				requestsWithRetries: data.requestsWithRetries,
				avgRetriesPerRequest: data.averageRetriesPerRequest ? data.averageRetriesPerRequest.toFixed(2) : null
			});
			break;
			
		case 'error':
			logStats(context, 'UPDATE', `Error metrics updated`, {
				operation,
				totalErrors: data.totalErrors,
				byType: Object.keys(data.byType || {}).length,
				byStatus: Object.keys(data.byStatus || {}).length
			});
			break;
	}
}

/**
 * Log stats queries and results
 */
export function logStatsQuery(context, queryOptions, results) {
	if (!context?.req?.verbose) return;
	
	const requestedMetrics = queryOptions.metrics || ['all'];
	const windows = queryOptions.windows || ['all'];
	
	logStats(context, 'QUERY', `Stats query executed`, {
		metrics: Array.isArray(requestedMetrics) ? requestedMetrics.join(', ') : requestedMetrics,
		windows: Array.isArray(windows) ? windows.join(', ') : windows,
		timestamp: results.timestamp,
		hasData: Object.keys(results.data || {}).length > 0
	});
}

/**
 * Log stats operations (reset, snapshot, etc.)
 */
export function logStatsOperation(context, operation, details = {}) {
	if (!context?.req?.verbose) return;
	
	switch (operation) {
		case 'reset':
			logStats(context, 'OPERATION', `Stats reset performed`, {
				timestamp: details.timestamp,
				scope: details.scope || 'all'
			});
			break;
			
		case 'snapshot':
			logStats(context, 'OPERATION', `Stats snapshot created`, {
				timestamp: details.timestamp,
				dataSize: details.dataSize || 'unknown'
			});
			break;
			
		case 'window-update':
			logStats(context, 'OPERATION', `Time window updated`, {
				windowType: details.windowType,
				oldestEntry: details.oldestEntry,
				newestEntry: details.newestEntry,
				entriesRemoved: details.entriesRemoved || 0
			});
			break;
	}
}

/**
 * Log stats system lifecycle events
 */
export function logStatsSystem(context, event, details = {}) {
	if (!context?.req?.verbose) return;
	
	switch (event) {
		case 'enabled':
			logStats(context, 'SYSTEM', `Stats collection enabled`, {
				runtime: details.runtime === true,
				initialization: details.initialization === true,
				isolated: details.isolated === true
			});
			break;
			
		case 'disabled':
			logStats(context, 'SYSTEM', `Stats collection disabled`, {
				runtime: details.runtime === true,
				initialization: details.initialization === true
			});
			break;
			
		case 'instance-created':
			logStats(context, 'SYSTEM', `Stats instance created`, {
				type: details.type || 'unknown',
				isolated: details.isolated === true
			});
			break;
			
		case 'listener-error':
			logStats(context, 'SYSTEM', `Stats listener error`, {
				errorType: details.error?.name || 'unknown',
				errorMessage: details.error?.message || 'unknown',
				listener: details.listener || 'unknown'
			});
			break;
	}
}

/**
 * Log module-specific verbose information
 */
export function logModuleActivity(context, module, activity, data) {
	if (!context?.req?.verbose) return;
	
	logStats(context, 'MODULE', `${module.toUpperCase()}: ${activity}`, data);
}

/**
 * Helper to create context for verbose logging when context is not available
 * @param {boolean} verbose - verbose flag
 * @returns {object} context object for logging
 */
export function createStatsContext(verbose) {
	return {
		req: {
			verbose: verbose === true
		}
	};
}