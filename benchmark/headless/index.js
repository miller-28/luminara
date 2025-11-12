import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if Playwright is installed
async function checkPlaywrightInstallation() {
	try {
		await import('@playwright/test');
		return true;
	} catch (error) {
		return false;
	}
}

// Display installation notice
function displayInstallNotice() {
	console.log('\n╔══════════════════════════════════════════════════════════════╗');
	console.log('║                  ⚠️  PLAYWRIGHT NOT INSTALLED                ║');
	console.log('╚══════════════════════════════════════════════════════════════╝\n');
	console.log('Playwright is required to run headless browser benchmarks.\n');
	console.log('📦 Install Playwright with browsers:\n');
	console.log('   cd benchmark');
	console.log('   npm install');
	console.log('   npx playwright install\n');
	console.log('Or install globally:\n');
	console.log('   npm install -g @playwright/test');
	console.log('   npx playwright install\n');
	console.log('Then run: npm run benchmark:headless\n');
	process.exit(1);
}

class HeadlessBenchmarkRunner {
	constructor() {
		this.browsers = ['chromium', 'firefox', 'webkit'];
		this.results = new Map();
		this.timeout = 60000; // 60 seconds per browser
	}

	async runAll() {
		console.log('╔══════════════════════════════════════════════════════════════╗');
		console.log('║      LUMINARA HEADLESS BROWSER BENCHMARK SUITE               ║');
		console.log('╚══════════════════════════════════════════════════════════════╝\n');

		console.log('📋 Configuration:');
		console.log(`   Browsers: ${this.browsers.join(', ')}`);
		console.log(`   Server: http://localhost:2880/benchmark/browser/index.html\n`);

		for (const browserName of this.browsers) {
			console.log(`\n🌐 Running benchmarks in ${browserName}...`);
			const startTime = Date.now();
			try {
				// Add timeout wrapper
				await Promise.race([
					this.runBrowser(browserName),
					new Promise((_, reject) => 
						setTimeout(() => reject(new Error('Timeout: Browser took too long')), this.timeout)
					)
				]);
				const duration = ((Date.now() - startTime) / 1000).toFixed(2);
				console.log(`✅ ${browserName} completed in ${duration}s`);
			} catch (error) {
				const duration = ((Date.now() - startTime) / 1000).toFixed(2);
				console.error(`❌ ${browserName} failed after ${duration}s:`, error.message);
				// Don't exit - continue with other browsers
			}
		}

		// Always generate report, even if some browsers failed
		if (this.results.size > 0) {
			this.generateReport();
		} else {
			console.error('\n❌ No results collected - all browsers failed');
			process.exit(1);
		}
	}

	async runBrowser(browserName) {
		let browser;
		
		try {
			// Dynamically import Playwright
			console.log(`   📦 Loading Playwright for ${browserName}...`);
			const { chromium, firefox, webkit } = await import('@playwright/test');
			
			// Launch browser
			console.log(`   🚀 Launching ${browserName}...`);
			const launchOptions = { headless: true };
			switch (browserName) {
				case 'chromium':
					browser = await chromium.launch(launchOptions);
					break;
				case 'firefox':
					browser = await firefox.launch(launchOptions);
					break;
				case 'webkit':
					browser = await webkit.launch(launchOptions);
					break;
			}

			console.log(`   🌐 Creating browser context...`);
			const context = await browser.newContext();
			const page = await context.newPage();

			// Serve benchmark page (assumes server is running)
			console.log(`   📄 Loading benchmark page...`);
			const benchmarkUrl = 'http://localhost:2880/benchmark/browser/index.html';
			
			try {
				await page.goto(benchmarkUrl, { waitUntil: 'networkidle', timeout: 10000 });
			} catch (error) {
				throw new Error(`Failed to load ${benchmarkUrl}. Is the server running? (npm run serve)`);
			}

			// Wait for Luminara and Bench to be available
			console.log(`   ⏳ Waiting for Luminara to load...`);
			try {
				await page.waitForFunction(() => {
					return window.Bench && window.createLuminara;
				}, { timeout: 10000 });
			} catch (error) {
				throw new Error('Luminara not loaded. Did you run "npm run build"?');
			}

			// Run benchmarks in browser context
			console.log(`   ⚡ Running benchmarks (this may take 10-20 seconds)...`);
			const results = await page.evaluate(async () => {
				const { Bench, createLuminara } = window;
				const benchmarkResults = [];

				// Core benchmarks - reduced time for faster execution
				const coreBench = new Bench({ time: 500, warmupTime: 50 });
				
				coreBench.add('createLuminara()', () => {
					createLuminara({ baseURL: 'http://localhost:9999' });
				});

				coreBench.add('api.use() - 1 plugin', () => {
					const api = createLuminara();
					api.use({ name: 'test', onRequest: () => {} });
				});

				coreBench.add('api.updateConfig()', () => {
					const api = createLuminara();
					api.updateConfig({ retry: 3 });
				});

				await coreBench.run();

				coreBench.tasks.forEach(task => {
					benchmarkResults.push({
						name: task.name,
						mean: task.result.mean,
						hz: task.result.hz,
						p99: task.result.p99
					});
				});

				return benchmarkResults;
			});

			this.results.set(browserName, results);
			console.log(`   ✅ Completed ${results.length} benchmarks`);

			await browser.close();

		} catch (error) {
			console.error(`   ❌ Error in ${browserName}:`, error.message);
			if (error.stack) {
				console.error(`   Stack: ${error.stack.split('\n')[0]}`);
			}
			if (browser) {
				try {
					await browser.close();
				} catch (closeError) {
					// Ignore close errors
				}
			}
			// Don't re-throw - let runAll handle it gracefully
		}
	}

	generateReport() {
		console.log('\n\n📊 CROSS-BROWSER COMPARISON');
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

		// Check if we have any results
		if (this.results.size === 0) {
			console.log('⚠️  No results to display\n');
			return;
		}

		// Show summary
		console.log(`✅ Successfully tested: ${Array.from(this.results.keys()).join(', ')}`);
		const failedBrowsers = this.browsers.filter(b => !this.results.has(b));
		if (failedBrowsers.length > 0) {
			console.log(`❌ Failed browsers: ${failedBrowsers.join(', ')}`);
		}
		console.log('');

		// Get all unique benchmark names
		const allBenchmarks = new Set();
		this.results.forEach(results => {
			results.forEach(r => allBenchmarks.add(r.name));
		});

		// Print comparison table
		const successfulBrowsers = Array.from(this.results.keys());
		console.log('Benchmark'.padEnd(40) + successfulBrowsers.map(b => b.padEnd(20)).join(''));
		console.log('─'.repeat(40 + (successfulBrowsers.length * 20)));

		allBenchmarks.forEach(benchmarkName => {
			let row = benchmarkName.substring(0, 38).padEnd(40);
			
			successfulBrowsers.forEach(browserName => {
				const browserResults = this.results.get(browserName) || [];
				const result = browserResults.find(r => r.name === benchmarkName);
				
				if (result) {
					const opsDisplay = this.formatOps(result.hz).padEnd(20);
					row += opsDisplay;
				} else {
					row += 'N/A'.padEnd(20);
				}
			});

			console.log(row);
		});

		// Save JSON reports
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
		const reportData = {
			timestamp: new Date().toISOString(),
			browsers: Object.fromEntries(this.results),
			summary: {
				totalBrowsers: this.browsers.length,
				successfulBrowsers: this.results.size,
				failedBrowsers: this.browsers.length - this.results.size,
				totalBenchmarks: allBenchmarks.size
			}
		};

		// Save latest report
		const latestPath = join(__dirname, '../reports/headless-latest.json');
		fs.writeFileSync(latestPath, JSON.stringify(reportData, null, 2));
		console.log(`\n📁 Latest report: ${latestPath}`);

		// Save historical report
		const historyDir = join(__dirname, '../reports/history');
		if (!fs.existsSync(historyDir)) {
			fs.mkdirSync(historyDir, { recursive: true });
		}
		const historyPath = join(historyDir, `headless-${timestamp}.json`);
		fs.writeFileSync(historyPath, JSON.stringify(reportData, null, 2));
		console.log(`📁 History saved: ${historyPath}`);

		console.log('\n✅ Headless benchmark suite completed!');
	}

	formatOps(ops) {
		if (ops >= 1000000) return `${(ops / 1000000).toFixed(2)}M ops/s`;
		if (ops >= 1000) return `${(ops / 1000).toFixed(2)}K ops/s`;
		return `${ops.toFixed(0)} ops/s`;
	}
}

// Run if executed directly
const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
	console.log('🔍 Starting headless benchmark runner...\n');
	
	// Check Playwright installation first
	const isInstalled = await checkPlaywrightInstallation();
	if (!isInstalled) {
		displayInstallNotice();
	}
	
	console.log('✅ Playwright detected\n');
	
	const runner = new HeadlessBenchmarkRunner();
	
	try {
		await runner.runAll();
		console.log('\n🎉 All benchmarks completed successfully!\n');
		process.exit(0);
	} catch (error) {
		console.error('\n❌ Fatal error:', error.message);
		console.error(error.stack);
		process.exit(1);
	}
}

export { HeadlessBenchmarkRunner };
