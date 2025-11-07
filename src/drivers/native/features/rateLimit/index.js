/**
 * Rate Limiting Feature Integration
 * 
 * Internal integration of rate limiting with Luminara client.
 * Provides seamless request throttling without external API exposure.
 */

import { createLimiter } from './limiter.js';
import { deriveKey } from './key.js';

/**
 * Create rate limiting feature for Luminara client integration
 * @param {Object} config - Rate limiting configuration
 * @returns {Object} Rate limiting feature instance
 */
export function createRateLimitFeature(config) {

	// Create environment dependencies with proper binding
	const env = {
		now: () => Date.now(),
		setInterval: typeof setInterval !== 'undefined' ? setInterval.bind(globalThis) : null,
		clearInterval: typeof clearInterval !== 'undefined' ? clearInterval.bind(globalThis) : null
	};
	
	// Create the rate limiter
	const limiter = createLimiter(config, { env, deriveKey });
	
	/**
	 * Schedule a request through rate limiting
	 * @param {string|Object} keyOrReq - Rate limiting key or full request object
	 * @param {Function} [requestFn] - Optional request function to execute
	 * @returns {Promise} Promise that resolves when request can proceed
	 */
	async function schedule(keyOrReq, requestFn) {

		// Support both key-only and full request object APIs
		if (typeof keyOrReq === 'string') {

			// String key API: schedule(key) - create minimal request object
			return new Promise((resolve) => {
				limiter.schedule({ url: keyOrReq }, () => {
					resolve();

					return Promise.resolve();
				});
			});
		} else {

			// Request object API: schedule(req, fn) - pass through full request object
			if (requestFn) {
				return limiter.schedule(keyOrReq, requestFn);
			} else {

				// schedule(req) without function - just wait for rate limiting
				return new Promise((resolve) => {
					limiter.schedule(keyOrReq, () => {
						resolve();

						return Promise.resolve();
					});
				});
			}
		}
	}
	
	/**
	 * Generate rate limiting key for a request
	 * @param {Object} req - Request object
	 * @returns {string} Rate limiting key
	 */
	function generateKey(req) {
		return deriveKey(req, limiter.config.scope, {
			include: limiter.config.include,
			exclude: limiter.config.exclude
		});
	}
	
	/**
	 * Wrap a request function with rate limiting
	 * @param {Function} originalRequestFn - Original request function
	 * @returns {Function} Rate-limited request function
	 */
	function wrapRequest(originalRequestFn) {
		return async function(req) {

			// Schedule the request through the rate limiter
			return limiter.schedule(req, () => originalRequestFn.call(this, req));
		};
	}
	
	/**
	 * Update rate limiting configuration at runtime
	 * @param {Object} partialConfig - Partial configuration to merge
	 */
	function update(partialConfig) {
		limiter.update(partialConfig);
	}
	
	/**
	 * Get rate limiting statistics
	 * @returns {Object} Current statistics and bucket states
	 */
	function getStats() {
		return limiter.stats.get();
	}
	
	/**
	 * Reset rate limiting statistics
	 */
	function resetStats() {
		limiter.stats.reset();
	}
	
	/**
	 * Shutdown the rate limiter
	 */
	function shutdown() {
		limiter.shutdown();
	}
	
	return {
		schedule,
		generateKey,
		wrapRequest,
		update,
		stats: {
			get: getStats,
			reset: resetStats
		},
		shutdown
	};
}