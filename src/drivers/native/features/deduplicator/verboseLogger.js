/**
 * Verbose Logger for Deduplicator Feature
 * Simple logging without BaseVerboseLogger - logs directly to console
 */

export function createDeduplicateVerboseLogger() {
	return {
		log(message) {
			console.info(`🔄 [DEDUP] ${message}`);
		},

		keyGenerated(key, strategy) {
			this.log(`🔑 Generated key: ${key} (strategy: ${strategy})`);
		},

		duplicateDetected(waiters) {
			this.log(`🚫 Duplicate detected - attaching to existing request (${waiters} waiters)`);
		},

		requestCompleted(waiters) {
			if (waiters > 0) {
				this.log(`⚡ Request completed - notifying ${waiters} waiters`);
			}
		},

		cacheHit() {
			this.log('💾 Cache hit - using cached result (burst protection)');
		},

		newRequest() {
			this.log('🆕 No duplicate found, executing new request');
		},

		methodExcluded(method) {
			this.log(`🔒 Method ${method} excluded from deduplication`);
		},

		disabled() {
			this.log('❌ Deduplication disabled for this request');
		},

		conditionFailed() {
			this.log('🚫 Condition check failed, skipping deduplication');
		},

		cacheCleanup(removed) {
			if (removed > 0) {
				this.log(`🧹 Cleaned up ${removed} expired cache entries`);
			}
		},

		stats(stats) {
			const rate = (stats.rate * 100).toFixed(1);
			this.log(`📊 Stats: ${stats.deduplicated} deduplicated / ${stats.total} total (${rate}% rate)`);
		},

		cacheCleared() {
			this.log('🗑️ Cache cleared');
		},

		errorCached() {
			this.log('💥 Request failed, cached error');
		},

		successCached() {
			this.log('✅ Request completed successfully, cached result');
		},

		noCaching() {
			this.log('⏭️ No caching (TTL=0)');
		}
	};
}
