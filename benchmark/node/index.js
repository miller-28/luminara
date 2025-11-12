import { Command } from 'commander';
import config from '../config.js';
import { MockServer, generateJsonPayload, generateBlobPayload } from './fixtures/mockServer.js';
import { BenchmarkRunner } from './runner.js';
import { ConsoleReporter } from './reporter.js';
import { coreBenchmarks } from './suites/core.bench.js';
import { orchestrationBenchmarks } from './suites/orchestration.bench.js';
import { driverBenchmarks } from './suites/driver.bench.js';
import { featureBenchmarks } from './suites/features.bench.js';
import { integratedBenchmarks } from './suites/integrated.bench.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Main benchmark entry point
 */
async function main() {
	const program = new Command();
	
	program
		.name('luminara-benchmark')
		.description('Performance benchmarks for Luminara HTTP client')
		.version('0.1.0')
		.option('-c, --category <category>', 'Run specific category (core, orchestration, driver, features, integrated)')
		.option('-m, --memory', 'Enable memory profiling')
		.option('--save-baseline', 'Save results as baseline for comparison')
		.option('--compare', 'Compare with baseline')
		.parse(process.argv);
	
	const options = program.opts();
	
	// Override config with CLI options
	if (options.memory) {
		config.enableMemoryProfiling = true;
	}
	
	// Create reporter
	const reporter = new ConsoleReporter(config);
	reporter.printHeader();
	
	try {
		// Start mock server
		const mockServer = new MockServer({
			port: config.mockServer.port,
			latency: config.mockServer.latency,
			responses: {
				'/json-small': generateJsonPayload(config.mockServer.payloadSizes.small),
				'/json-medium': generateJsonPayload(config.mockServer.payloadSizes.medium),
				'/json-large': generateJsonPayload(config.mockServer.payloadSizes.large),
				'/text': 'Hello World',
				'/blob': generateBlobPayload(config.mockServer.payloadSizes.xlarge)
			}
		});
		
		await mockServer.start();
		console.log(`✅ Mock server started on port ${config.mockServer.port}\n`);
		
		// Create runner and register suites
		const runner = new BenchmarkRunner(config);
		runner.registerSuite('core', coreBenchmarks);
		runner.registerSuite('orchestration', orchestrationBenchmarks);
		runner.registerSuite('driver', driverBenchmarks);
		runner.registerSuite('features', featureBenchmarks);
		runner.registerSuite('integrated', integratedBenchmarks);
		
		// Load baseline if comparing
		let baseline = null;
		if (options.compare) {
			try {
				const baselinePath = path.resolve(__dirname, config.baseline);
				const baselineData = await fs.readFile(baselinePath, 'utf-8');
				baseline = JSON.parse(baselineData);
				console.log(`✅ Loaded baseline from ${baselinePath}\n`);
			} catch (error) {
				console.warn(`⚠️  Could not load baseline: ${error.message}\n`);
			}
		}
		
		// Run benchmarks
		let results;
		if (options.category) {
			reporter.printCategoryHeader(options.category);
			const bench = await runner.runCategory(options.category, mockServer);
			reporter.printBenchmarkResults(bench, baseline?.benchmarks);
			results = [{ category: options.category, bench }];
		} else {
			// Run all categories
			results = [];
			for (const category of runner.getCategories()) {
				reporter.printCategoryHeader(category);
				const bench = await runner.runCategory(category, mockServer);
				reporter.printBenchmarkResults(bench, baseline?.benchmarks);
				results.push({ category, bench });
			}
		}
		
		// Print summary
		const allBenches = results.map(r => r.bench);
		reporter.printSummary(allBenches, baseline);
		
		// Save results
		if (config.output.json) {
			const reportData = {
				meta: {
					timestamp: new Date().toISOString(),
					environment: {
						runtime: 'node',
						version: process.version,
						platform: process.platform,
						arch: process.arch
					},
					luminara: {
						version: '0.10.0' // TODO: Get from package.json
					},
					tinybench: {
						version: '2.9.0' // TODO: Get from package.json
					}
				},
				benchmarks: results.map(({ category, bench }) => ({
					category,
					tasks: bench.tasks.map(task => ({
						name: task.name,
						result: task.result ? {
							// Only include essential statistics, not raw samples
							mean: task.result.mean,
							median: task.result.median,
							p75: task.result.p75,
							p99: task.result.p99,
							p995: task.result.p995,
							min: task.result.min,
							max: task.result.max,
							sd: task.result.sd,
							hz: task.result.hz,
							sampleCount: task.result.samples?.length || 0
						} : null
					}))
				})),
				memory: results.map(({ category, bench }) => ({
					category,
					data: bench._memoryData || null
				}))
			};
			
			// Save latest
			const reportsDir = path.resolve(__dirname, '../reports');
			await fs.mkdir(reportsDir, { recursive: true });
			
			const latestPath = path.join(reportsDir, 'latest-node.json');
			await fs.writeFile(latestPath, JSON.stringify(reportData, null, 2));
			console.log(`📁 Report saved: ${latestPath}`);
			
			// Save history
			if (config.output.saveHistory) {
				const historyDir = path.join(reportsDir, 'history');
				await fs.mkdir(historyDir, { recursive: true });
				
				const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
				const historyPath = path.join(historyDir, `${timestamp}.json`);
				await fs.writeFile(historyPath, JSON.stringify(reportData, null, 2));
				console.log(`📁 History saved: ${historyPath}`);
			}
			
			// Save as baseline if requested
			if (options.saveBaseline) {
				const baselinePath = path.resolve(__dirname, config.baseline);
				await fs.writeFile(baselinePath, JSON.stringify(reportData, null, 2));
				console.log(`📁 Baseline saved: ${baselinePath}`);
			}
		}
		
		console.log();
		
		// Close mock server
		await mockServer.close();
		
	} catch (error) {
		reporter.printError(error);
		process.exit(1);
	}
}

// Run if called directly
main().catch(console.error);
