import { Bench } from 'tinybench';
import { runBenchmarkSuiteWithGC } from './utils.js';

/**
 * Benchmark runner - orchestrates benchmark execution
 */
export class BenchmarkRunner {
	constructor(config) {
		this.config = config;
		this.suites = new Map();
	}
	
	/**
	 * Register a benchmark suite
	 */
	registerSuite(category, suiteFactory) {
		this.suites.set(category, suiteFactory);
	}
	
	/**
	 * Create Tinybench instance with config
	 */
	createBench(category) {
		return new Bench({
			time: this.config.tinybench.time,
			warmup: this.config.tinybench.warmup,
			warmupTime: this.config.tinybench.warmupTime,
			iterations: this.config.tinybench.iterations,
			throws: false // Don't throw on benchmark errors
		});
	}
	
	/**
	 * Run specific category
	 */
	async runCategory(category, mockServer) {
		const suiteFactory = this.suites.get(category);
		if (!suiteFactory) {
			throw new Error(`Unknown category: ${category}`);
		}
		
		const bench = this.createBench(category);
		await suiteFactory(bench, mockServer, this.config);
		
		return await runBenchmarkSuiteWithGC(bench, this.config);
	}
	
	/**
	 * Run all benchmarks
	 */
	async runAll(mockServer) {
		const results = [];
		
		for (const [category] of this.suites) {
			const bench = await this.runCategory(category, mockServer);
			results.push({ category, bench });
		}
		
		return results;
	}
	
	/**
	 * Get available categories
	 */
	getCategories() {
		return Array.from(this.suites.keys());
	}
}
