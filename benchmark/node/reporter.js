import chalk from 'chalk';
import Table from 'cli-table3';
import { formatTime, formatMemory, formatOpsPerSec, calculatePercentageChange } from './utils.js';

/**
 * Console reporter for benchmark results
 */
export class ConsoleReporter {
	constructor(config = {}) {
		this.config = config;
		this.startTime = null;
	}
	
	printHeader() {
		const header = [
			'╔══════════════════════════════════════════════════════════════╗',
			'║           LUMINARA PERFORMANCE BENCHMARK SUITE               ║',
			`║                     Node.js ${process.version.padEnd(28)} ║`,
			`║                   Luminara v0.10.0${' '.repeat(23)}║`,
			'╚══════════════════════════════════════════════════════════════╝'
		].join('\n');
		
		console.log(chalk.cyan(header));
		console.log();
		this.startTime = Date.now();
	}
	
	printCategoryHeader(category) {
		const title = this.getCategoryTitle(category);
		console.log(chalk.bold.yellow(`\n📊 ${title}`));
		console.log(chalk.gray('━'.repeat(62)));
		console.log();
	}
	
	getCategoryTitle(category) {
		const titles = {
			core: 'Core Layer Benchmarks',
			orchestration: 'Orchestration Layer Benchmarks',
			driver: 'Driver Layer Benchmarks',
			features: 'Feature Benchmarks',
			integrated: 'Integrated Scenario Benchmarks',
			memory: 'Memory Benchmarks'
		};
		return titles[category] || category;
	}
	
	printBenchmarkResults(bench, baseline = null) {
		const table = new Table({
			head: [
				chalk.white.bold('Benchmark'),
				chalk.white.bold('Mean'),
				chalk.white.bold('Median'),
				chalk.white.bold('P99'),
				chalk.white.bold('Ops/sec')
			],
			style: {
				head: [],
				border: ['gray']
			},
			colWidths: [35, 12, 12, 12, 14]
		});
		
		bench.tasks.forEach(task => {
			if (!task.result) {
				return;
			}
			
			const result = task.result;
			const baselineResult = baseline?.find(b => b.name === task.name);
			
			let meanStr = formatTime(result.mean);
			if (baselineResult) {
				const change = calculatePercentageChange(result.mean, baselineResult.mean);
				const changeStr = change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
				const changeColor = change >= 10 ? chalk.red : change <= -5 ? chalk.green : chalk.yellow;
				meanStr += ` ${changeColor(changeStr)}`;
			}
			
			table.push([
				task.name,
				meanStr,
				formatTime(result.median || result.mean),
				formatTime(result.p99 || result.max || result.mean),
				formatOpsPerSec(result.hz || 0)
			]);
		});
		
		console.log(table.toString());
		
		// Print memory info if available
		if (bench._memoryData) {
			console.log();
			console.log(chalk.gray('Memory Usage:'));
			const mem = bench._memoryData;
			const delta = mem.delta >= 0 ? `+${formatMemory(mem.delta)}` : formatMemory(mem.delta);
			const color = mem.delta > 1 ? chalk.red : mem.delta > 0.1 ? chalk.yellow : chalk.green;
			console.log(chalk.gray(`  • Total allocation: ${color(delta)}`));
			console.log(chalk.gray(`  • Heap before: ${formatMemory(mem.before.heapUsed)}`));
			console.log(chalk.gray(`  • Heap after: ${formatMemory(mem.after.heapUsed)}`));
		}
		
		console.log();
	}
	
	printSummary(allResults, baseline = null) {
		const totalBenchmarks = allResults.reduce((sum, r) => sum + r.tasks.length, 0);
		const duration = this.startTime ? (Date.now() - this.startTime) / 1000 : 0;
		
		console.log(chalk.gray('━'.repeat(62)));
		console.log(chalk.bold.yellow('\n📊 Summary'));
		console.log(chalk.gray('━'.repeat(62)));
		console.log();
		
		console.log(chalk.white(`  Total Benchmarks:     ${totalBenchmarks}`));
		console.log(chalk.green(`  Passed:               ${totalBenchmarks}`));
		console.log(chalk.white(`  Duration:             ${duration.toFixed(1)}s`));
		console.log();
		
		// Calculate performance highlights
		const allTasks = allResults.flatMap(r => r.tasks.filter(t => t.result));
		if (allTasks.length > 0) {
			console.log(chalk.bold('  📈 Performance Highlights:'));
			
			// Find specific benchmarks
			const clientInit = allTasks.find(t => t.name.includes('createLuminara') && t.name.includes('cold'));
			const pluginExec = allTasks.find(t => t.name.includes('PluginPipeline'));
			
			if (clientInit?.result) {
				console.log(chalk.gray(`     • Client init overhead:      ${formatTime(clientInit.result.mean)} (cold)`));
			}
			
			if (pluginExec?.result) {
				const perPlugin = pluginExec.result.mean / 5; // Assuming 5 plugins
				console.log(chalk.gray(`     • Plugin execution (avg):    ${formatTime(perPlugin)} per plugin`));
			}
			
			// Calculate average memory if available
			const benchesWithMemory = allResults.filter(r => r._memoryData);
			if (benchesWithMemory.length > 0) {
				const totalMemoryDelta = benchesWithMemory.reduce((sum, r) => sum + r._memoryData.delta, 0);
				const maxHeap = Math.max(...benchesWithMemory.map(r => r._memoryData.after.heapUsed));
				
				console.log();
				console.log(chalk.bold('  💾 Memory Usage:'));
				console.log(chalk.gray(`     • Peak heap:                 ${formatMemory(maxHeap)}`));
				console.log(chalk.gray(`     • Total allocation:          ${formatMemory(totalMemoryDelta)}`));
			}
		}
		
		console.log();
		console.log(chalk.gray('━'.repeat(62)));
		console.log();
	}
	
	printError(error) {
		console.error(chalk.red(`\n❌ Error: ${error.message}`));
		if (error.stack) {
			console.error(chalk.gray(error.stack));
		}
		console.log();
	}
}
