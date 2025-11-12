/**
 * Utility functions for benchmarking
 */

/**
 * Capture memory usage
 */
export function captureMemoryUsage() {
	if (typeof process !== 'undefined') {
		const usage = process.memoryUsage();
		return {
			heapUsed: usage.heapUsed / 1024 / 1024, // MB
			heapTotal: usage.heapTotal / 1024 / 1024,
			external: usage.external / 1024 / 1024,
			rss: usage.rss / 1024 / 1024
		};
	} else if (performance.memory) {
		return {
			heapUsed: performance.memory.usedJSHeapSize / 1024 / 1024,
			heapTotal: performance.memory.totalJSHeapSize / 1024 / 1024,
			heapLimit: performance.memory.jsHeapSizeLimit / 1024 / 1024
		};
	}
	return null;
}

/**
 * Force garbage collection
 */
export function forceGC() {
	if (global.gc) {
		global.gc();
	}
}

/**
 * Sleep utility
 */
export function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(current, baseline) {
	if (!baseline) return 0;
	return ((current - baseline) / baseline) * 100;
}

/**
 * Format time in milliseconds
 */
export function formatTime(ms) {
	if (ms < 0.001) {
		return `${(ms * 1000000).toFixed(3)} ns`;
	} else if (ms < 1) {
		return `${(ms * 1000).toFixed(3)} μs`;
	} else if (ms < 1000) {
		return `${ms.toFixed(3)} ms`;
	} else {
		return `${(ms / 1000).toFixed(3)} s`;
	}
}

/**
 * Format memory size in MB
 */
export function formatMemory(mb) {
	if (mb < 0.001) {
		return `${(mb * 1024).toFixed(2)} KB`;
	} else if (mb < 1) {
		return `${mb.toFixed(3)} MB`;
	} else if (mb < 1024) {
		return `${mb.toFixed(2)} MB`;
	} else {
		return `${(mb / 1024).toFixed(2)} GB`;
	}
}

/**
 * Format operations per second
 */
export function formatOpsPerSec(ops) {
	if (ops >= 1000000) {
		return `${(ops / 1000000).toFixed(2)}M ops/s`;
	} else if (ops >= 1000) {
		return `${(ops / 1000).toFixed(2)}K ops/s`;
	} else {
		return `${ops.toFixed(0)} ops/s`;
	}
}

/**
 * Calculate statistics from samples
 */
export function calculateStats(samples) {
	const sorted = [...samples].sort((a, b) => a - b);
	const len = sorted.length;
	
	const sum = samples.reduce((a, b) => a + b, 0);
	const mean = sum / len;
	
	const variance = samples.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / len;
	const stdDev = Math.sqrt(variance);
	
	return {
		mean,
		median: sorted[Math.floor(len / 2)],
		p75: sorted[Math.floor(len * 0.75)],
		p95: sorted[Math.floor(len * 0.95)],
		p99: sorted[Math.floor(len * 0.99)],
		p995: sorted[Math.floor(len * 0.995)],
		min: sorted[0],
		max: sorted[len - 1],
		stdDev,
		samples: len
	};
}

/**
 * Run benchmark with memory profiling
 */
export async function runWithMemoryProfile(bench) {
	const memoryBefore = captureMemoryUsage();
	
	await bench.run();
	
	const memoryAfter = captureMemoryUsage();
	
	// Store memory data separately (task.result is not extensible)
	if (memoryBefore && memoryAfter) {
		bench._memoryData = {
			before: memoryBefore,
			after: memoryAfter,
			delta: memoryAfter.heapUsed - memoryBefore.heapUsed
		};
	}
	
	return bench;
}

/**
 * Run benchmark with GC
 */
export async function runBenchmarkSuiteWithGC(bench, config) {
	if (config.forceGCBetweenSuites) {
		forceGC();
		await sleep(100); // Let GC complete
	}
	
	if (config.enableMemoryProfiling) {
		return await runWithMemoryProfile(bench);
	} else {
		await bench.run();
		return bench;
	}
}
