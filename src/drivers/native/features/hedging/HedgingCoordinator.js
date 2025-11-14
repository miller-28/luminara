/**
 * HedgingCoordinator - Manages hedged request lifecycle
 * Coordinates multiple concurrent/sequential requests based on policy
 */

import { cancelAndRetryPolicy, racePolicy } from './policies.js';
import * as hedgingLogger from './verboseLogger.js';

export class HedgingCoordinator {
	constructor(preparedRequest, currentAttempt, driverExecuteFn) {
		this.preparedRequest = preparedRequest;
		this.currentAttempt = currentAttempt;
		this.driverExecuteFn = driverExecuteFn;
		
		// Merge global and per-request hedging config
		this.config = {
			enabled: true,
			policy: 'cancel-and-retry',
			hedgeDelay: 2000,
			maxHedges: 2,
			cancelOnSuccess: true,
			includeHttpMethods: ['GET', 'HEAD', 'OPTIONS'],
			serverRotation: null,
			timeout: null,
			exponentialBackoff: false,
			backoffMultiplier: 1.5,
			jitter: true,
			jitterRange: 0.2,
			trackStats: true,
			retryHedgedRequests: false,
			...preparedRequest.hedging
		};
		
		this.controllers = [];
		this.errors = [];
		this.startTime = Date.now();
		this.resolved = false;
		this.verbose = preparedRequest.verbose || false;
		
		// Track hedging metadata
		this.metadata = {
			winner: null,
			totalAttempts: 0,
			latencySaved: 0,
			policy: this.config.policy
		};
	}
	
	/**
	 * Main execution entry point
	 */
	async execute() {
		const { method, fullUrl } = this.preparedRequest;
		
		if (this.verbose) {
			hedgingLogger.logHedgingEnabled(
				method,
				fullUrl,
				this.config.policy,
				this.config.hedgeDelay,
				this.config.maxHedges
			);
		}
		
		try {
			const result = await this.executePolicy();
			
			// Track stats if enabled
			if (this.config.trackStats && this.preparedRequest.context?.statsHub) {
				this.trackStats();
			}
			
			// DO NOT cleanup on success - the winning request's signal must remain active
			// while the response body is being parsed by SuccessResponseHandler
			// The policy already cancelled non-winning requests
			
			return result;
		} catch (error) {
			// Track failed hedging attempt
			if (this.config.trackStats && this.preparedRequest.context?.statsHub) {
				this.trackStats(error);
			}
			
			// Cleanup all controllers on error
			this.cleanup();
			
			throw error;
		}
	}
	
	/**
	 * Execute the configured hedging policy
	 */
	async executePolicy() {
		const { policy } = this.config;
		
		switch (policy) {
			case 'cancel-and-retry':
				return await cancelAndRetryPolicy(this);
			case 'race':
				return await racePolicy(this);
			default:
				throw new Error(`Unknown hedging policy: ${policy}`);
		}
	}
	
	/**
	 * Execute a single request (primary or hedge)
	 */
	executeRequest = async (index, type, signal) => {
		const requestStartTime = Date.now();
		this.metadata.totalAttempts++;
		
		// Build request URL (with server rotation if configured)
		const requestUrl = this.buildRequestUrl(index);
		
		// Clone prepared request with modified URL and signal
		const hedgedRequest = {
			...this.preparedRequest,
			fullUrl: requestUrl,
			signal,
			hedging: {
				...this.config,
				type,
				index
			}
		};
		
		// Apply per-hedge timeout if configured
		if (this.config.timeout !== null) {
			hedgedRequest.timeout = this.config.timeout;
		}
		
		if (this.verbose && index > 0) {
			const elapsed = Date.now() - this.startTime;
			hedgingLogger.logHedgeTriggered(index, elapsed, this.controllers.length);
		}
		
		try {
			// Execute request through driver
			const response = await this.driverExecuteFn(hedgedRequest, this.currentAttempt);
			
			// Track winner
			const elapsed = Date.now() - this.startTime;
			this.metadata.winner = type;
			
			if (index === 0) {
				// Primary won
				this.metadata.latencySaved = 0;
			} else {
				// Hedge won - calculate latency saved
				const primaryEstimatedTime = elapsed;
				const hedgeTime = Date.now() - requestStartTime;
				this.metadata.latencySaved = Math.max(0, primaryEstimatedTime - hedgeTime);
			}
			
			if (this.verbose) {
				hedgingLogger.logHedgeWinner(type, elapsed, this.metadata.latencySaved);
			}
			
			// Attach hedging metadata to response
			if (response && typeof response === 'object') {
				response.hedgingMetadata = {
					winner: this.metadata.winner,
					totalAttempts: this.metadata.totalAttempts,
					latencySaved: this.metadata.latencySaved,
					policy: this.config.policy,
					type
				};
			}
			
			return response;
		} catch (error) {
			// Track error
			this.errors.push({
				type,
				error: error.message || String(error)
			});
			
			throw error;
		}
	};
	
	/**
	 * Build request URL with server rotation if configured
	 */
	buildRequestUrl(index) {
		const { fullUrl } = this.preparedRequest;
		const { serverRotation } = this.config;
		
		// No server rotation or primary request
		if (!serverRotation || index === 0) {
			return fullUrl;
		}
		
		// Normalize serverRotation to array
		const servers = Array.isArray(serverRotation) ? serverRotation : [serverRotation];
		
		// Get server for this hedge (round-robin)
		const serverIndex = (index - 1) % servers.length;
		const targetServer = servers[serverIndex];
		
		try {
			const originalUrl = new URL(fullUrl);
			const targetUrl = new URL(targetServer);
			
			// Check if target URL has a path beyond root
			const hasPath = targetUrl.pathname !== '/';
			
			if (hasPath) {
				// Full URL mode - use as-is
				if (this.verbose) {
					hedgingLogger.logServerRotation(index, targetServer);
				}
				return targetServer;
			} else {
				// Domain-only mode - append original path and query
				const rotatedUrl = new URL(originalUrl.pathname + originalUrl.search, targetUrl.origin);
				
				if (this.verbose) {
					hedgingLogger.logServerRotation(index, rotatedUrl.toString());
				}
				
				return rotatedUrl.toString();
			}
		} catch (error) {
			// Fallback to original URL on parse error
			console.warn(`[HEDGING] Failed to parse server rotation URL: ${error.message}`);
			return fullUrl;
		}
	}
	
	/**
	 * Track hedging stats in StatsHub
	 */
	trackStats(error = null) {
		const statsHub = this.preparedRequest.context?.statsHub;
		if (!statsHub) {
			return;
		}
		
		try {
			const hedgingStats = statsHub.modules?.hedging;
			if (!hedgingStats) {
				return;
			}
			
			if (error) {
				// Failed hedging attempt
				hedgingStats.recordFailure(this.metadata);
			} else {
				// Successful hedging
				hedgingStats.recordSuccess(this.metadata);
			}
		} catch (err) {
			// Silently fail stats tracking
			if (this.verbose) {
				console.warn('[HEDGING] Failed to track stats:', err.message);
			}
		}
	}
	
	/**
	 * Cleanup abort controllers
	 */
	cleanup() {
		this.controllers.forEach(controller => {
			if (!controller.signal.aborted) {
				try {
					controller.abort();
				} catch (error) {
					// Ignore cleanup errors
				}
			}
		});
	}
}
