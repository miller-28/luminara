import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REPORTS_DIR = join(__dirname, '../reports');
const OUTPUT_FILE = join(REPORTS_DIR, 'report.html');

class HTMLReportGenerator {
	constructor() {
		this.latestReport = null;
		this.historyReports = [];
	}

	loadReports() {
		// Load latest report
		const latestPath = join(REPORTS_DIR, 'latest-node.json');
		if (fs.existsSync(latestPath)) {
			this.latestReport = JSON.parse(fs.readFileSync(latestPath, 'utf-8'));
		}

		// Load history
		const historyDir = join(REPORTS_DIR, 'history');
		if (fs.existsSync(historyDir)) {
			const historyFiles = fs.readdirSync(historyDir)
				.filter(f => f.endsWith('.json'))
				.sort()
				.slice(-10); // Last 10 runs

			this.historyReports = historyFiles.map(file => {
				return JSON.parse(fs.readFileSync(join(historyDir, file), 'utf-8'));
			});
		}
	}

	generate() {
		this.loadReports();

		if (!this.latestReport) {
			console.error('❌ No benchmark reports found. Run benchmarks first.');
			return;
		}

		const html = this.generateHTML();
		fs.writeFileSync(OUTPUT_FILE, html);

		console.log('✅ HTML report generated successfully!');
		console.log(`📁 Report location: ${OUTPUT_FILE}`);
		console.log(`🌐 Open in browser: file://${OUTPUT_FILE}`);
	}

	generateHTML() {
		const report = this.latestReport;
		
		// Extract summary data from meta
		const summary = {
			timestamp: report.meta.timestamp,
			totalBenchmarks: report.benchmarks.reduce((sum, cat) => sum + cat.tasks.length, 0),
			duration: 'N/A', // Not available in current format
			nodeVersion: report.meta.environment.version,
			luminaraVersion: report.meta.luminara.version
		};
		
		// Flatten benchmarks for easier rendering
		const allBenchmarks = [];
		report.benchmarks.forEach(category => {
			category.tasks.forEach(task => {
				allBenchmarks.push({
					category: category.category,
					name: task.name,
					result: task.result
				});
			});
		});

		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Luminara Benchmark Report</title>
	<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>
	<style>
		:root {
			--primary: #6366f1;
			--secondary: #8b5cf6;
			--success: #10b981;
			--bg-dark: #1e1e1e;
			--bg-light: #2d2d2d;
			--text: #e4e4e7;
			--text-dim: #a1a1aa;
			--border: #3f3f46;
		}

		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}

		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			background: linear-gradient(135deg, var(--bg-dark) 0%, var(--bg-light) 100%);
			color: var(--text);
			padding: 40px;
			line-height: 1.6;
		}

		.container {
			max-width: 1400px;
			margin: 0 auto;
		}

		header {
			text-align: center;
			margin-bottom: 50px;
		}

		h1 {
			font-size: 3rem;
			background: linear-gradient(135deg, var(--primary), var(--secondary));
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			margin-bottom: 10px;
		}

		.subtitle {
			color: var(--text-dim);
			font-size: 1.2rem;
		}

		.summary-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
			gap: 20px;
			margin-bottom: 50px;
		}

		.summary-card {
			background: var(--bg-light);
			padding: 25px;
			border-radius: 12px;
			border: 1px solid var(--border);
			text-align: center;
		}

		.summary-label {
			color: var(--text-dim);
			font-size: 0.9rem;
			margin-bottom: 10px;
		}

		.summary-value {
			font-size: 2rem;
			font-weight: 700;
			color: var(--primary);
		}

		.section {
			background: var(--bg-light);
			padding: 30px;
			border-radius: 12px;
			margin-bottom: 30px;
			border: 1px solid var(--border);
		}

		h2 {
			font-size: 1.8rem;
			margin-bottom: 20px;
			color: var(--text);
		}

		table {
			width: 100%;
			border-collapse: collapse;
		}

		thead {
			background: var(--bg-dark);
		}

		th {
			padding: 15px;
			text-align: left;
			font-weight: 600;
			color: var(--text-dim);
			text-transform: uppercase;
			font-size: 0.85rem;
		}

		td {
			padding: 15px;
			border-bottom: 1px solid var(--border);
		}

		tbody tr:hover {
			background: rgba(99, 102, 241, 0.1);
		}

		.chart-container {
			height: 400px;
			margin-top: 20px;
		}

		.metric-highlight {
			color: var(--success);
			font-weight: 600;
		}

		.category-badge {
			display: inline-block;
			padding: 4px 12px;
			border-radius: 20px;
			background: rgba(99, 102, 241, 0.2);
			color: var(--primary);
			font-size: 0.85rem;
			font-weight: 600;
		}

		footer {
			text-align: center;
			margin-top: 50px;
			color: var(--text-dim);
			font-size: 0.9rem;
		}
	</style>
</head>
<body>
	<div class="container">
		<header>
			<h1>🌟 Luminara Benchmark Report</h1>
			<p class="subtitle">Generated on ${new Date(summary.timestamp).toLocaleString()}</p>
		</header>

		<div class="summary-grid">
			<div class="summary-card">
				<div class="summary-label">Total Benchmarks</div>
				<div class="summary-value">${summary.totalBenchmarks}</div>
			</div>
			<div class="summary-card">
				<div class="summary-label">Duration</div>
				<div class="summary-value">${summary.duration}</div>
			</div>
			<div class="summary-card">
				<div class="summary-label">Node.js</div>
				<div class="summary-value">${summary.nodeVersion}</div>
			</div>
			<div class="summary-card">
				<div class="summary-label">Luminara</div>
				<div class="summary-value">${summary.luminaraVersion}</div>
			</div>
		</div>

		<div class="section">
			<h2>📊 Benchmark Results</h2>
			<table>
				<thead>
					<tr>
						<th>Benchmark</th>
						<th>Category</th>
						<th>Mean (ms)</th>
						<th>Ops/sec</th>
						<th>P99 (ms)</th>
					</tr>
				</thead>
				<tbody>
					${allBenchmarks.map(bench => `
						<tr>
							<td>${bench.name}</td>
							<td><span class="category-badge">${bench.category}</span></td>
							<td>${(bench.result.mean * 1000).toFixed(3)}</td>
							<td class="metric-highlight">${Math.round(bench.result.hz).toLocaleString()}</td>
							<td>${(bench.result.p99 * 1000).toFixed(3)}</td>
						</tr>
					`).join('')}
				</tbody>
			</table>
		</div>

		<div class="section">
			<h2>⚡ Operations per Second</h2>
			<div class="chart-container">
				<canvas id="opsChart"></canvas>
			</div>
		</div>

		${this.historyReports.length > 0 ? `
		<div class="section">
			<h2>📈 Performance Trends</h2>
			<div class="chart-container">
				<canvas id="trendChart"></canvas>
			</div>
		</div>
		` : ''}

		<footer>
			<p>Generated by Luminara Benchmark Suite · Powered by Tinybench</p>
		</footer>
	</div>

	<script>
		const allBenchmarks = ${JSON.stringify(allBenchmarks)};

		// Ops/sec chart
		const opsCtx = document.getElementById('opsChart').getContext('2d');
		const sortedResults = allBenchmarks.sort((a, b) => b.result.hz - a.result.hz).slice(0, 20);
		
		new Chart(opsCtx, {
			type: 'bar',
			data: {
				labels: sortedResults.map(r => r.name.substring(0, 50)),
				datasets: [{
					label: 'Operations per Second',
					data: sortedResults.map(r => Math.round(r.result.hz)),
					backgroundColor: 'rgba(99, 102, 241, 0.6)',
					borderColor: 'rgba(99, 102, 241, 1)',
					borderWidth: 1
				}]
			},
			options: {
				indexAxis: 'y',
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { display: false },
					tooltip: {
						callbacks: {
							label: function(context) {
								return context.parsed.x.toLocaleString() + ' ops/s';
							}
						}
					}
				}
			}
		});

		${this.historyReports.length > 0 ? `
		// Trend chart (history tracking)
		const trendCtx = document.getElementById('trendChart').getContext('2d');
		const history = ${JSON.stringify(this.historyReports)};
		
		// Track a few key benchmarks over time
		const keyBenchmarks = ['createLuminara() - cold start', 'api.use() - register 1 plugin'];
		const datasets = keyBenchmarks.map((benchName, i) => {
			return {
				label: benchName,
				data: history.map(h => {
					let result = null;
					for (const cat of h.benchmarks) {
						result = cat.tasks.find(t => t.name === benchName);
						if (result) break;
					}
					return result ? result.result.hz : 0;
				}),
				borderColor: ['rgba(99, 102, 241, 1)', 'rgba(139, 92, 246, 1)'][i],
				backgroundColor: ['rgba(99, 102, 241, 0.1)', 'rgba(139, 92, 246, 0.1)'][i],
				tension: 0.4
			};
		});

		new Chart(trendCtx, {
			type: 'line',
			data: {
				labels: history.map(h => new Date(h.meta.timestamp).toLocaleTimeString()),
				datasets
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { position: 'top' }
				}
			}
		});
		` : ''}
	</script>
</body>
</html>`;
	}
}

// Run if executed directly
const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
	const generator = new HTMLReportGenerator();
	generator.generate();
}

export { HTMLReportGenerator };
