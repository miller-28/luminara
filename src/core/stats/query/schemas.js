/**
 * Output schemas for Luminara stats metrics
 * Defines the shape of data returned by each metric type
 */

/**
 * Counter metrics schema
 * @typedef {Object} CountersSchema
 * @property {number} total - Total requests made
 * @property {number} success - Successful requests
 * @property {number} fail - Failed requests
 * @property {number} inflight - Currently in-flight requests
 * @property {number} retried - Requests that were retried
 * @property {number} aborted - Aborted requests
 * @property {number} debouncing - Currently debouncing requests
 * @property {number} cancelledByDebouncing - Requests cancelled by debouncing
 */
export const createCountersSchema = () => ({
	total: 0,
	success: 0,
	fail: 0,
	inflight: 0,
	retried: 0,
	aborted: 0,
	debouncing: 0,
	cancelledByDebouncing: 0
});

/**
 * Time metrics schema
 * @typedef {Object} TimeSchema
 * @property {number} minMs - Minimum response time in milliseconds
 * @property {number} avgMs - Average response time in milliseconds
 * @property {number} p50Ms - 50th percentile response time
 * @property {number} p95Ms - 95th percentile response time
 * @property {number} p99Ms - 99th percentile response time
 * @property {number} maxMs - Maximum response time in milliseconds
 */
export const createTimeSchema = () => ({
	minMs: 0,
	avgMs: 0,
	p50Ms: 0,
	p95Ms: 0,
	p99Ms: 0,
	maxMs: 0
});

/**
 * Rate metrics schema
 * @typedef {Object} RateSchema
 * @property {number} rps - Requests per second
 * @property {number} rpm - Requests per minute
 * @property {string} mode - Rate calculation mode
 */
export const createRateSchema = (mode = 'ema-30s') => ({
	rps: 0,
	rpm: 0,
	mode
});

/**
 * Retry metrics schema
 * @typedef {Object} RetrySchema
 * @property {number} count - Number of retried requests
 * @property {number} successAfterAvg - Average retry attempts before success
 * @property {number} minBackoffMs - Minimum backoff time in milliseconds
 * @property {number} avgBackoffMs - Average backoff time in milliseconds
 * @property {number} maxBackoffMs - Maximum backoff time in milliseconds
 * @property {number} giveups - Number of requests that gave up after max retries
 */
export const createRetrySchema = () => ({
	count: 0,
	successAfterAvg: 0,
	minBackoffMs: 0,
	avgBackoffMs: 0,
	maxBackoffMs: 0,
	giveups: 0
});

/**
 * Error metrics schema
 * @typedef {Object} ErrorSchema
 * @property {Object} byClass - Error counts by classification
 * @property {number} byClass.timeout - Timeout errors
 * @property {number} byClass.network - Network errors
 * @property {number} byClass.aborted - Aborted requests
 * @property {number} byClass.4xx - 4xx status code errors
 * @property {number} byClass.5xx - 5xx status code errors
 * @property {number} byClass.other - Other unclassified errors
 * @property {Array} topCodes - Top error codes with counts
 */
export const createErrorSchema = () => ({
	byClass: {
		timeout: 0,
		network: 0,
		aborted: 0,
		'4xx': 0,
		'5xx': 0,
		other: 0
	},
	topCodes: []
});

/**
 * Merge two counter schemas
 */
export const mergeCounters = (a, b) => ({
	total: a.total + b.total,
	success: a.success + b.success,
	fail: a.fail + b.fail,
	inflight: a.inflight + b.inflight,
	retried: a.retried + b.retried,
	aborted: a.aborted + b.aborted
});

/**
 * Merge time metrics by calculating percentiles from combined samples
 */
export const mergeTime = (samples) => {
	if (!samples.length) {
		return createTimeSchema();
	}
	
	const sorted = samples.slice().sort((a, b) => a - b);
	const len = sorted.length;
	
	return {
		minMs: sorted[0],
		avgMs: sorted.reduce((sum, val) => sum + val, 0) / len,
		p50Ms: sorted[Math.floor(len * 0.5)],
		p95Ms: sorted[Math.floor(len * 0.95)],
		p99Ms: sorted[Math.floor(len * 0.99)],
		maxMs: sorted[len - 1]
	};
};

/**
 * Merge error schemas
 */
export const mergeErrors = (schemas) => {
	const merged = createErrorSchema();
	const allCodes = new Map();
	
	for (const schema of schemas) {

		// Merge by class
		for (const [key, value] of Object.entries(schema.byClass)) {
			merged.byClass[key] += value;
		}
		
		// Collect all error codes
		for (const codeEntry of schema.topCodes) {
			const current = allCodes.get(codeEntry.code) || 0;
			allCodes.set(codeEntry.code, current + codeEntry.count);
		}
	}
	
	// Sort and return top codes
	merged.topCodes = Array.from(allCodes.entries())
		.map(([code, count]) => ({ code: parseInt(code), count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, 10); // Top 10 error codes
	
	return merged;
};

/**
 * Supported metric types
 */
export const METRIC_TYPES = ['counters', 'time', 'rate', 'retry', 'error'];

/**
 * Supported groupBy dimensions
 */
export const GROUP_BY_DIMENSIONS = ['endpoint', 'domain', 'method', 'tag', 'none'];

/**
 * Supported time windows
 */
export const TIME_WINDOWS = ['since-start', 'since-reset', 'rolling-60s'];