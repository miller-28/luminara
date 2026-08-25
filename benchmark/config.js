export default {
	// Tinybench settings
	tinybench: {
		time: 300,           // Keep production report generation light enough for small servers
		warmup: true,        // Enable warmup phase
		warmupTime: 50,      // Warmup for 50ms
		iterations: undefined // Auto-calculate optimal iterations
	},
	
	// Mock server settings
	mockServer: {
		port: 9999,
		latency: 0, // Zero latency for pure library overhead
		payloadSizes: {
			small: 1024,        // 1 KB
			medium: 10240,      // 10 KB
			large: 102400,      // 100 KB
			xlarge: 1048576     // 1 MB
		}
	},
	
	// Memory profiling
	enableMemoryProfiling: false,
	forceGCBetweenSuites: true,
	
	// Output settings
	output: {
		console: true,
		json: true,
		html: false, // Browser only
		saveHistory: true
	},
	
	// Regression detection
	regressionThreshold: 10, // % degradation threshold
	baseline: './reports/baseline.json',
	
	// Browser-specific settings (Playwright)
	browser: {
		headless: true,
		browsers: ['chromium', 'firefox', 'webkit'],
		viewport: { width: 1280, height: 720 }
	},
	
	// Feature flags
	features: {
		skipSlowBenchmarks: false,
		parallelExecution: false,
		includeMemoryBenchmarks: true,
		includeConcurrencyBenchmarks: true
	},
	
	// Luminara instrumentation
	luminara: {
		enableInternalTimings: true, // Enable __benchmark flag
		exportInternals: true // Export internal classes for direct benchmarking
	}
};
