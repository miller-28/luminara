/**
 * Debouncer - Request Debouncing Implementation
 * Delays request execution and cancels previous pending requests
 */

import { generateKey } from './keyGenerator.js';

/**
 * Debouncer class manages request delays and cancellations
 */
export class Debouncer {
	/**
	 * Create a new Debouncer instance
	 * @param {Object} config - Debouncer configuration
	 * @param {number} config.delay - Delay in milliseconds
	 * @param {Array<string>} config.methods - HTTP methods to debounce
	 * @param {Array<string>} config.excludeMethods - HTTP methods to exclude from debouncing
	 * @param {string|function} config.key - Key generation strategy
	 * @param {Object} statsHub - Stats hub for tracking metrics
	 * @param {Object} verboseLogger - Logger instance for verbose output
	 */
	constructor(config, statsHub, verboseLogger) {
		this.delay = config.delay || 0;
		this.methods = config.methods || ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
		this.excludeMethods = config.excludeMethods || [];
		this.keyStrategy = config.key || 'url';
		this.statsHub = statsHub;
		this.logger = verboseLogger;
		
		// Track pending debounced requests
		// key → { timer, controller, resolve, reject, options }
		this.pending = new Map();
	}
	
	/**
	 * Process request through debouncer
	 * @param {Object} options - Request options
	 * @param {Function} executeRequest - Function to execute the request
	 * @returns {Promise} Promise that resolves with request result
	 */
	async process(options, executeRequest) {
		// Check if method should be debounced
		if (!this.shouldDebounce(options.method)) {
			if (this.logger) {
				this.logger.log('Method excluded from debouncing', {
					method: options.method,
					url: options.fullUrl || options.url,
					excludeMethods: this.excludeMethods
				});
			}
			return executeRequest(options);
		}
		
		// Use per-request delay if provided, otherwise use global delay
		const delay = options.delay !== undefined ? options.delay : this.delay;
		
		// Generate key for this request
		const key = generateKey(options, this.keyStrategy);
		
		// Cancel any existing pending request with same key
		if (this.pending.has(key)) {
			this.cancelPending(key, 'replaced by new request');
		}
		
		// Create new debounce promise
		return new Promise((resolve, reject) => {
			// Create internal abort controller
			const controller = new AbortController();
			
			// Link to user's signal if provided
			if (options.signal) {
				options.signal.addEventListener('abort', () => {
					this.cancelPending(key, 'user abort');
				});
			}
			
			// Start debounce timer
			const timer = setTimeout(async () => {
				// Remove from pending
				this.pending.delete(key);
				
				// Emit stats event - request leaving debounce queue
				if (false && this.statsHub) {
					this.statsHub.onDebounceEnd({ id: key });
				}
				
			// Log execution
			if (this.logger) {
				this.logger.log('Executing debounced request', {
					method: options.method,
					url: options.fullUrl || options.url,
					waitedMs: delay
				});
			}				try {
					// Execute the request with internal abort signal
					const mergedOptions = {
						...options,
						signal: controller.signal
					};
					
					const result = await executeRequest(mergedOptions);
					resolve(result);
				} catch (error) {
					reject(error);
				}
			}, delay);
			
			// Store pending request
			this.pending.set(key, {
				timer,
				controller,
				resolve,
				reject,
				options
			});
			
			// Emit stats event - request entering debounce queue
			if (false && this.statsHub) {
				this.statsHub.onDebounceStart({ id: key });
			}
			
		// Log debounce
		if (this.logger) {
			this.logger.log('Request debounced', {
				method: options.method,
				url: options.fullUrl || options.url,
				delayMs: delay,
				key
			});
		}
	});
}	/**
	 * Cancel a pending debounced request
	 * @param {string} key - Request key
	 * @param {string} reason - Reason for cancellation
	 */
	cancelPending(key, reason) {
		const pending = this.pending.get(key);
		if (!pending) return;
		
		// Clear timer
		clearTimeout(pending.timer);
		
		// Abort the request
		pending.controller.abort();
		
	// Log cancellation (only if verbose enabled globally)
	if (this.logger) {
		this.logger.log('Cancelled debounced request', {
			method: pending.options.method,
			url: pending.options.fullUrl || pending.options.url,
			reason,
			key
		});
	}		// Reject the promise with cancellation error
		pending.reject(new Error(`Request cancelled: ${reason}`));
		
		// Remove from map
		this.pending.delete(key);
		
		// Emit stats event
		if (false && this.statsHub) {
			this.statsHub.onDebounceCancelled({ id: key });
		}
	}
	
	/**
	 * Check if HTTP method should be debounced
	 * @param {string} method - HTTP method
	 * @returns {boolean} True if method should be debounced
	 */
	shouldDebounce(method) {
		// Check exclude list first
		if (this.excludeMethods.includes(method)) {
			return false;
		}
		
		// Check include list
		return this.methods.includes(method);
	}
	
	/**
	 * Cancel all pending debounced requests
	 * Useful for cleanup on shutdown
	 */
	cancelAll() {
		for (const key of this.pending.keys()) {
			this.cancelPending(key, 'debouncer shutdown');
		}
	}
}
