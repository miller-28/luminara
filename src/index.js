import { LuminaraClient } from './core/luminara.js';
import { NativeFetchDriver } from './drivers/native/index.js';

// Simple factory that creates a default client (uses NativeFetchDriver)
export function createLuminara(config = {}) {
	const driver = NativeFetchDriver(config);

	return new LuminaraClient(driver, [], config);  // Pass config to client too
}

// Re-export client, driver, and utilities for users that need custom setups
export { LuminaraClient } from './core/luminara.js';
export { NativeFetchDriver } from './drivers/native/index.js';
export { backoffStrategies, createBackoffHandler } from './drivers/native/features/retry/backoff.js';
export { 
	defaultRetryPolicy, 
	createRetryPolicy, 
	parseRetryAfter, 
	isIdempotentMethod,
	IDEMPOTENT_METHODS,
	DEFAULT_RETRY_STATUS_CODES
} from './drivers/native/features/retry/retryPolicy.js';

// Export stats system components
export { StatsHub } from './core/stats/StatsHub.js';
export { METRIC_TYPES, GROUP_BY_DIMENSIONS, TIME_WINDOWS } from './core/stats/query/schemas.js';
