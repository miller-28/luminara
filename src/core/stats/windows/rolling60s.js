/**
 * Rolling 60-second time window implementation using a ring buffer
 * Efficiently stores data points in a sliding window
 */

export class Rolling60sWindow {
	constructor() {
		this.bucketSize = 1000; // 1 second per bucket
		this.bucketCount = 60; // 60 buckets for 60 seconds
		this.buckets = new Array(this.bucketCount).fill(null).map(() => ({
			timestamp: 0,
			data: []
		}));
		this.currentBucketIndex = 0;
		this.lastUpdateTime = Date.now();
	}

	/**
	 * Add a data point to the rolling window
	 */
	add(dataPoint) {
		const now = Date.now();
		this._rotateBuckets(now);
		
		const bucketIndex = this._getCurrentBucketIndex(now);
		this.buckets[bucketIndex].data.push({
			...dataPoint,
			timestamp: now
		});
	}

	/**
	 * Get all data points within the 60-second window
	 */
	getData() {
		const now = Date.now();
		this._rotateBuckets(now);
		
		const cutoffTime = now - (60 * 1000); // 60 seconds ago
		const results = [];
		
		for (const bucket of this.buckets) {
			if (bucket.timestamp >= cutoffTime) {
				results.push(...bucket.data.filter(point => point.timestamp >= cutoffTime));
			}
		}
		
		return results;
	}

	/**
	 * Clear all data from the window
	 */
	clear() {
		this.buckets.forEach(bucket => {
			bucket.data = [];
			bucket.timestamp = 0;
		});
		this.currentBucketIndex = 0;
		this.lastUpdateTime = Date.now();
	}

	/**
	 * Get data points matching a filter function
	 */
	getFiltered(filterFn) {
		return this.getData().filter(filterFn);
	}

	/**
	 * Rotate buckets based on time elapsed
	 */
	_rotateBuckets(currentTime) {
		const timeElapsed = currentTime - this.lastUpdateTime;
		const bucketsToRotate = Math.floor(timeElapsed / this.bucketSize);
		
		if (bucketsToRotate > 0) {
			// Clear old buckets and move to new position
			for (let i = 0; i < Math.min(bucketsToRotate, this.bucketCount); i++) {
				this.currentBucketIndex = (this.currentBucketIndex + 1) % this.bucketCount;
				this.buckets[this.currentBucketIndex].data = [];
				this.buckets[this.currentBucketIndex].timestamp = currentTime;
			}
			
			this.lastUpdateTime = currentTime;
		}
	}

	/**
	 * Get the current bucket index for the given time
	 */
	_getCurrentBucketIndex(currentTime) {
		this._rotateBuckets(currentTime);
		return this.currentBucketIndex;
	}

	/**
	 * Get statistics about the window
	 */
	getStats() {
		const data = this.getData();
		return {
			totalPoints: data.length,
			timespan: 60000, // 60 seconds in ms
			oldestPoint: data.length > 0 ? Math.min(...data.map(p => p.timestamp)) : null,
			newestPoint: data.length > 0 ? Math.max(...data.map(p => p.timestamp)) : null
		};
	}
}