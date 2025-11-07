/**
 * Rate Limiter - Token Bucket Algorithm Implementation
 * 
 * Internal rate limiting using token bucket algorithm with FIFO queuing.
 * Supports scope-based rate limiting (global, domain, endpoint) with
 * configurable burst capacity and request scheduling.
 */

import { rateLimitLogger } from './verboseLogger.js';

/**
 * Creates a rate limiter instance with token bucket algorithm
 * @param {Object} config - Rate limiting configuration
 * @param {Object} options - Environment dependencies and utilities
 * @returns {Object} Rate limiter instance with schedule, update, stats, shutdown methods
 */
export function createLimiter(config, { env, deriveKey }) {

	// Helper function for conditional logging
	const log = (message, data) => {
		if (config.verbose) {
			rateLimitLogger.log({ req: { verbose: true } }, 'LIMITER', message, data);
		}
	};
	
	// Normalize configuration to standard format
	let normalizedConfig = normalizeConfig(config);
	log('Initialized with config', normalizedConfig);
	
	// Rate limiting state
	const buckets = new Map(); // key -> { tokens, lastRefill, queue, inFlight }
	const stats = {
		queued: 0,
		dispatched: 0,
		dropped: 0,
		inFlight: 0
	};
	
	// Scheduler state
	let schedulerTimer = null;
	let isShutdown = false;
	
	/**
	 * Normalize rate configuration to standard format
	 */
	function normalizeConfig(cfg) {
		let limit, windowMs;
		
		if (cfg.rps) {
			limit = cfg.rps;
			windowMs = 1000; // 1 second
		} else if (cfg.rpm) {
			limit = cfg.rpm;
			windowMs = 60000; // 1 minute
		} else if (cfg.limit && cfg.windowMs) {
			limit = cfg.limit;
			windowMs = cfg.windowMs;
		} else {
			throw new Error('Rate limit configuration requires rps, rpm, or {limit, windowMs}');
		}
	
		const burst = cfg.burst !== undefined ? cfg.burst : limit;
		const ratePerMs = limit / windowMs;

		return {
			limit,
			windowMs,
			burst,
			ratePerMs,
			scope: cfg.scope || 'global',
			maxConcurrent: cfg.maxConcurrent || Infinity,
			queueLimit: cfg.queueLimit || Infinity,
			tickMs: cfg.tickMs || 25,
			include: cfg.include || undefined,
			exclude: cfg.exclude || undefined,
			verbose: cfg.verbose || false
		};
	}
	
	/**
	 * Get or create bucket for the given key
	 */
	function getBucket(key) {
		if (!buckets.has(key)) {
			buckets.set(key, {
				tokens: normalizedConfig.burst, // Start with full capacity
				lastRefill: env.now(),
				queue: [],
				inFlight: 0
			});
			log(`Created new bucket for key: ${key}`);
		}

		return buckets.get(key);
	}
	
	/**
	 * Refill tokens for a bucket based on elapsed time
	 */
	function refillTokens(bucket) {
		const now = env.now();
		const elapsed = now - bucket.lastRefill;
		const tokensToAdd = normalizedConfig.ratePerMs * elapsed;
		
		bucket.tokens = Math.min(normalizedConfig.burst, bucket.tokens + tokensToAdd);
		bucket.lastRefill = now;
		
		return bucket.tokens;
	}
	
	/**
	 * Check if we can dispatch more requests (token and concurrency limits)
	 */
	function canDispatch(bucket) {
		refillTokens(bucket);
		const totalInFlight = Array.from(buckets.values()).reduce((sum, b) => sum + b.inFlight, 0);
		
		return bucket.tokens >= 1 && totalInFlight < normalizedConfig.maxConcurrent;
	}
	
	/**
	 * Start the scheduler timer for processing queues
	 */
	function startScheduler() {
		if (schedulerTimer || isShutdown) {
			return;
		}
		
		log(`Starting scheduler with ${normalizedConfig.tickMs}ms interval`);
		schedulerTimer = env.setInterval(() => {
			processQueues();
		}, normalizedConfig.tickMs);
	}
	
	/**
	 * Process all bucket queues, dispatching ready requests
	 */
	function processQueues() {
		if (isShutdown) {
			return;
		}
		
		for (const [key, bucket] of buckets.entries()) {
			if (bucket.queue.length === 0) {
				continue;
			}
			
			// Dispatch as many requests as possible
			while (bucket.queue.length > 0 && canDispatch(bucket)) {
				const queuedRequest = bucket.queue.shift();
				bucket.tokens -= 1;
				bucket.inFlight += 1;
				stats.inFlight += 1;
				stats.dispatched += 1;
				
				log(`Dispatching request for key: ${key}, tokens remaining: ${bucket.tokens.toFixed(2)}`);
				
				// Dispatch the request
				const dispatchPromise = queuedRequest.dispatch();
				queuedRequest.resolve(dispatchPromise);
				
				// Handle completion
				dispatchPromise.finally(() => {
					bucket.inFlight -= 1;
					stats.inFlight -= 1;
					log(`Request completed for key: ${key}, inFlight: ${bucket.inFlight}`);
				});
			}
		}
	}
	
	/**
	 * Schedule a request through the rate limiter
	 * @param {Object} req - Request object
	 * @param {Function} dispatch - Function to dispatch the request
	 * @returns {Promise} Promise that resolves when request is dispatched
	 */
	function schedule(req, dispatch) {
		if (isShutdown) {
			return Promise.reject(new Error('Rate limiter is shutdown'));
		}
		
		const key = deriveKey(req, normalizedConfig.scope, {
			include: normalizedConfig.include,
			exclude: normalizedConfig.exclude
		});
		
		// Bypass rate limiting for excluded requests
		if (key === '__no_limit__') {
			if (normalizedConfig.verbose && req.debugRateLimit) {
				log(`Bypassing rate limiting for key: ${key}`);
			}

			return dispatch();
		}
		
		const bucket = getBucket(key);
		
		if (normalizedConfig.verbose && req.debugRateLimit) {
			log(`Rate limiting request with key: ${key}, tokens: ${bucket.tokens}, queue: ${bucket.queue.length}`);
		}
		
		// Check queue limit
		const totalQueued = Array.from(buckets.values()).reduce((sum, b) => sum + b.queue.length, 0);
		if (totalQueued >= normalizedConfig.queueLimit) {
			stats.dropped += 1;
			log(`Queue limit exceeded, dropping request for key: ${key}`);

			return Promise.reject(new Error('Rate limit queue is full'));
		}
		
		// If we can dispatch immediately, do so
		if (canDispatch(bucket)) {
			bucket.tokens -= 1;
			bucket.inFlight += 1;
			stats.inFlight += 1;
			stats.dispatched += 1;
			
			log(`Immediate dispatch for key: ${key}, tokens remaining: ${bucket.tokens.toFixed(2)}`);
			
			const dispatchPromise = dispatch();
			dispatchPromise.finally(() => {
				bucket.inFlight -= 1;
				stats.inFlight -= 1;
				log(`Request completed for key: ${key}, inFlight: ${bucket.inFlight}`);
			});
			
			return dispatchPromise;
		}
		
		// Queue the request
		stats.queued += 1;
		log(`Queuing request for key: ${key}, queue length: ${bucket.queue.length + 1}`);
		
		return new Promise((resolve, reject) => {
			const queuedRequest = {
				dispatch,
				resolve,
				reject,
				timestamp: env.now()
			};
			
			bucket.queue.push(queuedRequest);
			startScheduler();
		});
	}
	
	/**
	 * Update rate limiter configuration at runtime
	 * @param {Object} partialConfig - Partial configuration to merge
	 */
	function update(partialConfig) {
		log('Updating configuration', partialConfig);
		
		const newConfig = { ...normalizedConfig, ...partialConfig };
		normalizedConfig = normalizeConfig(newConfig);
		
		log('Updated configuration', normalizedConfig);
		
		// Clear existing buckets to apply new settings
		buckets.clear();
		log('Cleared existing buckets for configuration update');
	}
	
	/**
	 * Get current statistics
	 */
	function getStats() {
		const bucketStats = {};
		for (const [key, bucket] of buckets.entries()) {
			bucketStats[key] = {
				tokens: Math.round(bucket.tokens * 100) / 100,
				queued: bucket.queue.length,
				inFlight: bucket.inFlight
			};
		}
		
		return {
			...stats,
			buckets: bucketStats,
			config: normalizedConfig
		};
	}
	
	/**
	 * Reset statistics counters
	 */
	function resetStats() {
		stats.queued = 0;
		stats.dispatched = 0;
		stats.dropped = 0;
		stats.inFlight = 0;
		log('Statistics reset');
	}
	
	/**
	 * Shutdown the rate limiter
	 */
	function shutdown() {
		if (isShutdown) {
			return;
		}
		
		isShutdown = true;
		
		if (schedulerTimer) {
			env.clearInterval(schedulerTimer);
			schedulerTimer = null;
		}
		
		// Reject all queued requests
		for (const bucket of buckets.values()) {
			while (bucket.queue.length > 0) {
				const queuedRequest = bucket.queue.shift();
				queuedRequest.reject(new Error('Rate limiter shutdown'));
			}
		}
		
		buckets.clear();
		log('Rate limiter shutdown complete');
	}
	
	// Start the scheduler if needed
	startScheduler();
	
	return {
		schedule,
		update,
		stats: {
			get: getStats,
			reset: resetStats
		},
		config: normalizedConfig,
		shutdown
	};
}
