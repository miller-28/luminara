// Quick version of headless benchmarks for testing
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║      LUMINARA QUICK HEADLESS TEST (Chromium Only)            ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

console.log('📋 This is a quick test - full suite runs 3 browsers\n');

try {
	console.log('🚀 Launching Chromium...');
	const browser = await chromium.launch({ headless: true });
	
	console.log('🌐 Creating page...');
	const context = await browser.newContext();
	const page = await context.newPage();

	console.log('📄 Loading http://localhost:2880/benchmark/browser/index.html');
	await page.goto('http://localhost:2880/benchmark/browser/index.html', { 
		waitUntil: 'networkidle',
		timeout: 10000 
	});

	console.log('⏳ Waiting for dependencies...');
	await page.waitForFunction(() => window.Bench && window.createLuminara, { timeout: 10000 });

	console.log('⚡ Running quick benchmarks (core + hedging)...\n');
	const results = await page.evaluate(async () => {
		const { Bench, createLuminara } = window;
		const benchmarkResults = [];

		const bench = new Bench({ time: 200, warmupTime: 50 });
		
		bench.add('createLuminara()', () => {
			createLuminara({ baseURL: 'http://localhost:9999' });
		});

		bench.add('api.use() - 1 plugin', () => {
			const api = createLuminara();
			api.use({ name: 'test', onRequest: () => {} });
		});

		bench.add('api.updateConfig()', () => {
			const api = createLuminara();
			api.updateConfig({ retry: 3 });
		});

		// Add hedging benchmark
		const hedgingApi = createLuminara({
			baseURL: 'https://jsonplaceholder.typicode.com',
			hedging: {
				policy: 'race',
				hedgeDelay: 100,
				maxHedges: 1
			}
		});
		
		bench.add('Hedging - Race policy', async () => {
			try {
				await hedgingApi.get('/posts/1');
			} catch (error) {
				// Ignore errors in benchmark
			}
		});

		await bench.run();

		bench.tasks.forEach(task => {
			benchmarkResults.push({
				name: task.name,
				hz: task.result.hz
			});
		});

		return benchmarkResults;
	});

	console.log('📊 Results:\n');
	results.forEach(r => {
		const ops = r.hz >= 1000000 
			? `${(r.hz / 1000000).toFixed(2)}M ops/s`
			: r.hz >= 1000
				? `${(r.hz / 1000).toFixed(2)}K ops/s`
				: `${r.hz.toFixed(0)} ops/s`;
		
		console.log(`   ${r.name.padEnd(30)} ${ops}`);
	});

	await browser.close();
	
	console.log('\n✅ Quick test completed!');
	console.log('\n💡 To run full suite (all 3 browsers): npm run benchmark:headless');

} catch (error) {
	console.error('\n❌ Error:', error.message);
	
	if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
		console.error('\n⚠️  Server not running! Start it with:');
		console.error('   npm run serve\n');
	}
	
	process.exit(1);
}
