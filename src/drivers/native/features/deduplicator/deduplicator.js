/**
 * Deduplicator - Prevents duplicate in-flight requests
 * Core class for request deduplication feature
 */

import { RequestCache } from './requestCache.js';
import { generateKey } from './keyGenerator.js';

export class Deduplicator {
	constructor(config = {}, statsHub = null, verboseLogger = null) {
		// Apply defaults first
		const defaults = {
			keyStrategy: 'url+method',
			keyGenerator: null,
			includeHeaders: [],
			excludeMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],
			methods: null,
			cacheTTL: 100,
			maxCacheSize: 1000,
			condition: null
		};

		// If user specifies 'methods', remove excludeMethods default
		if (config.methods) {
			delete defaults.excludeMethods;
		}

		// Merge config with defaults
		this.config = {
			...defaults,
			...config
		};

		// Validate configuration
		this.validateConfig();

		this.cache = new RequestCache();
		this.statsHub = statsHub;
		this.logger = verboseLogger;

		// Stats tracking
		this.stats = {
			total: 0,
			deduplicated: 0,
			executed: 0
		};
	}

	/**
	 * Validate configuration
	 */
	validateConfig() {
		const { excludeMethods, methods, cacheTTL, maxCacheSize, keyStrategy, keyGenerator, includeHeaders } = this.config;

		// Cannot specify both excludeMethods and methods
		if (excludeMethods && methods) {
			throw new Error('Cannot specify both "excludeMethods" and "methods"');
		}

		// cacheTTL must be >= 0
		if (typeof cacheTTL !== 'number' || cacheTTL < 0) {
			throw new Error('cacheTTL must be >= 0');
		}

		// maxCacheSize must be > 0
		if (typeof maxCacheSize !== 'number' || maxCacheSize <= 0) {
			throw new Error('maxCacheSize must be > 0');
		}

		// excludeMethods must be array
		if (excludeMethods && !Array.isArray(excludeMethods)) {
			throw new Error('excludeMethods must be an array');
		}

		// methods must be array
		if (methods && !Array.isArray(methods)) {
			throw new Error('methods must be an array');
		}

		// keyStrategy custom requires keyGenerator
		if (keyStrategy === 'custom' && typeof keyGenerator !== 'function') {
			throw new Error('keyStrategy "custom" requires a keyGenerator function');
		}

		// keyGenerator must be function if provided
		if (keyGenerator !== null && typeof keyGenerator !== 'function') {
			throw new Error('keyGenerator must be a function');
		}

		// includeHeaders must be array
		if (includeHeaders && !Array.isArray(includeHeaders)) {
			throw new Error('includeHeaders must be an array');
		}
	}

	/**
	 * Process request with deduplication
	 * Returns either cached result or executes new request
	 */
	async process(request, executeFunction, options = {}) {
		this.stats.total++;

		// Check if disabled for this specific request
		if (options.disabled === true) {
			this.logger?.disabled();
			this.stats.executed++;
			return executeFunction();
		}

		// Merge per-request config with global config
		const config = { ...this.config, ...options };

		// Check if method should be deduplicated
		if (!this.shouldDeduplicateMethod(request.method, config)) {
			this.logger?.methodExcluded(request.method);
			this.stats.executed++;
			return executeFunction();
		}

		// Check conditional deduplication
		if (config.condition && !config.condition(request)) {
			this.logger?.conditionFailed();
			this.stats.executed++;
			return executeFunction();
		}

		// Generate request key
		const key = generateKey(request, config.keyStrategy, {
			keyGenerator: config.keyGenerator,
			includeHeaders: config.includeHeaders
		});

		this.logger?.keyGenerated(key, config.keyStrategy);

		// Check cache for existing request
		const cached = this.cache.get(key, config.cacheTTL);

		if (cached) {
			if (cached.type === 'in-flight') {
				// Duplicate in-flight request
				this.cache.addWaiter(key);
				const waiters = this.cache.getWaiters(key);
				this.logger?.duplicateDetected(waiters);
				this.stats.deduplicated++;

				// Track deduplicated request in stats
				if (this.statsHub) {
					this.statsHub.increment('requests.deduplicated');
				}

				// Return existing promise
				return cached.data.promise;
			} else if (cached.type === 'completed') {
				// Return cached result (burst protection)
				this.logger?.cacheHit();
				this.stats.deduplicated++;

				// Track deduplicated request in stats
				if (this.statsHub) {
					this.statsHub.increment('requests.deduplicated');
				}

				// Return cached result or throw cached error
				if (cached.data.isError) {
					throw cached.data.result;
				}
				return cached.data.result;
			}
		}

		// No cached request, execute new one
		this.logger?.newRequest();
		this.stats.executed++;

		// Create promise and store in cache
		const promise = this.executeAndCache(key, executeFunction, config);

		return promise;
	}

	/**
	 * Execute request and cache the result
	 */
	async executeAndCache(key, executeFunction, config) {
		// Create promise
		const promise = (async () => {
			try {
				const result = await executeFunction();

				// Cache successful result if TTL > 0
				if (config.cacheTTL > 0) {
					this.cache.complete(key, result, false);
					this.logger?.successCached();
				} else {
					this.cache.delete(key);
					this.logger?.noCaching();
				}

				// Cleanup expired entries periodically
				this.cache.cleanup(config.cacheTTL, config.maxCacheSize);

				const waiters = this.cache.getWaiters(key);
				if (waiters > 0) {
					this.logger?.requestCompleted(waiters);
				}

				return result;
			} catch (error) {
				// Cache error if TTL > 0
				if (config.cacheTTL > 0) {
					this.cache.complete(key, error, true);
					this.logger?.errorCached();
				} else {
					this.cache.delete(key);
					this.logger?.noCaching();
				}

				// Cleanup expired entries periodically
				this.cache.cleanup(config.cacheTTL, config.maxCacheSize);

				const waiters = this.cache.getWaiters(key);
				if (waiters > 0) {
					this.logger?.requestCompleted(waiters);
				}

				throw error;
			}
		})();

		// Store promise in cache
		this.cache.set(key, promise, null);

		return promise;
	}

	/**
	 * Check if method should be deduplicated
	 */
	shouldDeduplicateMethod(method, config) {
		const upperMethod = (method || 'GET').toUpperCase();

		// If methods whitelist specified, check if method is included
		if (config.methods) {
			return config.methods.some(m => m.toUpperCase() === upperMethod);
		}

		// If excludeMethods specified, check if method is NOT excluded
		if (config.excludeMethods) {
			return !config.excludeMethods.some(m => m.toUpperCase() === upperMethod);
		}

		// Default: deduplicate all methods
		return true;
	}

	/**
	 * Clear all cached requests
	 */
	clear() {
		this.cache.clear();
		this.logger?.cacheCleared();
	}

	/**
	 * Get deduplication statistics
	 */
	getStats() {
		const cacheSize = this.cache.size();

		return {
			total: this.stats.total,
			deduplicated: this.stats.deduplicated,
			executed: this.stats.executed,
			rate: this.stats.total > 0 ? this.stats.deduplicated / this.stats.total : 0,
			cache: cacheSize
		};
	}
}
