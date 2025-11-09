/**
 * RequestCache - Manages in-flight and completed request caching
 * Stores promises and their metadata for deduplication
 */
export class RequestCache {
	constructor() {
		this.inFlightRequests = new Map(); // key → { promise, timestamp, abortController, waiters }
		this.completedRequests = new Map(); // key → { result, timestamp, isError }
	}

	/**
	 * Store an in-flight request
	 */
	set(key, promise, abortController) {
		this.inFlightRequests.set(key, {
			promise,
			timestamp: Date.now(),
			abortController,
			waiters: 0
		});
	}

	/**
	 * Retrieve cached request (in-flight or completed)
	 */
	get(key, cacheTTL) {
		// Check in-flight first
		const inFlight = this.inFlightRequests.get(key);
		if (inFlight) {
			return { type: 'in-flight', data: inFlight };
		}

		// Check completed cache
		if (cacheTTL > 0) {
			const completed = this.completedRequests.get(key);
			if (completed) {
				const age = Date.now() - completed.timestamp;
				if (age <= cacheTTL) {
					return { type: 'completed', data: completed };
				}
				// Expired, remove it
				this.completedRequests.delete(key);
			}
		}

		return null;
	}

	/**
	 * Check if request is cached (in-flight or completed)
	 */
	has(key, cacheTTL) {
		if (this.inFlightRequests.has(key)) {
			return true;
		}

		if (cacheTTL > 0 && this.completedRequests.has(key)) {
			const completed = this.completedRequests.get(key);
			const age = Date.now() - completed.timestamp;
			if (age <= cacheTTL) {
				return true;
			}
			// Expired
			this.completedRequests.delete(key);
		}

		return false;
	}

	/**
	 * Move request from in-flight to completed
	 */
	complete(key, result, isError = false) {
		this.inFlightRequests.delete(key);
		this.completedRequests.set(key, {
			result,
			timestamp: Date.now(),
			isError
		});
	}

	/**
	 * Remove from cache (both in-flight and completed)
	 */
	delete(key) {
		this.inFlightRequests.delete(key);
		this.completedRequests.delete(key);
	}

	/**
	 * Increment waiter count for in-flight request
	 */
	addWaiter(key) {
		const inFlight = this.inFlightRequests.get(key);
		if (inFlight) {
			inFlight.waiters++;
		}
	}

	/**
	 * Get number of waiters for in-flight request
	 */
	getWaiters(key) {
		const inFlight = this.inFlightRequests.get(key);
		return inFlight ? inFlight.waiters : 0;
	}

	/**
	 * Clean up expired completed requests
	 */
	cleanup(cacheTTL, maxCacheSize) {
		const now = Date.now();

		// Remove expired entries
		if (cacheTTL > 0) {
			for (const [key, entry] of this.completedRequests.entries()) {
				const age = now - entry.timestamp;
				if (age > cacheTTL) {
					this.completedRequests.delete(key);
				}
			}
		}

		// Enforce max cache size (remove oldest entries)
		if (maxCacheSize > 0 && this.completedRequests.size > maxCacheSize) {
			const sortedEntries = Array.from(this.completedRequests.entries())
				.sort((a, b) => a[1].timestamp - b[1].timestamp);

			const toRemove = this.completedRequests.size - maxCacheSize;
			for (let i = 0; i < toRemove; i++) {
				this.completedRequests.delete(sortedEntries[i][0]);
			}
		}
	}

	/**
	 * Clear all cached requests
	 */
	clear() {
		this.inFlightRequests.clear();
		this.completedRequests.clear();
	}

	/**
	 * Get cache size (in-flight + completed)
	 */
	size() {
		return {
			inFlight: this.inFlightRequests.size,
			completed: this.completedRequests.size,
			total: this.inFlightRequests.size + this.completedRequests.size
		};
	}
}
