import fs from 'fs';
import os from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REPORTS_DIR = join(__dirname, '../reports');
const OUTPUT_FILE = join(REPORTS_DIR, 'report.html');

const escapeHTML = value => String(value)
	.replaceAll('&', '&amp;')
	.replaceAll('<', '&lt;')
	.replaceAll('>', '&gt;')
	.replaceAll('"', '&quot;')
	.replaceAll("'", '&#39;');

const hasMetric = result => result
	&& Number.isFinite(result.mean)
	&& Number.isFinite(result.hz)
	&& Number.isFinite(result.p99)
	&& result.sampleCount > 0;

const formatDuration = milliseconds => {
	if (milliseconds < 0.001) return `${(milliseconds * 1_000_000).toFixed(0)} ns`;
	if (milliseconds < 1) return `${(milliseconds * 1000).toFixed(2)} us`;
	if (milliseconds < 1000) return `${milliseconds.toFixed(3)} ms`;
	return `${(milliseconds / 1000).toFixed(3)} s`;
};

const formatOps = hz => Math.round(hz).toLocaleString();

const formatDate = value => new Intl.DateTimeFormat('en', {
	year: 'numeric',
	month: 'short',
	day: 'numeric',
	hour: '2-digit',
	minute: '2-digit',
	second: '2-digit',
	timeZoneName: 'short'
}).format(new Date(value));

class HTMLReportGenerator {
	constructor() {
		this.latestReport = null;
		this.historyReports = [];
	}

	loadReports() {
		const latestPath = join(REPORTS_DIR, 'latest-node.json');
		if (fs.existsSync(latestPath)) {
			this.latestReport = JSON.parse(fs.readFileSync(latestPath, 'utf-8'));
		}

		const historyDir = join(REPORTS_DIR, 'history');
		if (fs.existsSync(historyDir)) {
			const historyFiles = fs.readdirSync(historyDir)
				.filter(file => file.endsWith('.json'))
				.sort()
				.slice(-10);

			this.historyReports = historyFiles.map(file => {
				return JSON.parse(fs.readFileSync(join(historyDir, file), 'utf-8'));
			});
		}
	}

	generate() {
		this.loadReports();

		if (!this.latestReport) {
			console.error('No benchmark reports found. Run benchmarks first.');
			return;
		}

		const html = this.generateHTML();
		fs.writeFileSync(OUTPUT_FILE, html);

		console.log('HTML report generated successfully!');
		console.log(`Report location: ${OUTPUT_FILE}`);
		console.log(`Open in browser: file://${OUTPUT_FILE}`);
	}

	getBenchmarks(report) {
		return report.benchmarks.flatMap(category => {
			return category.tasks.map(task => ({
				category: category.category,
				name: task.name,
				result: task.result
			}));
		});
	}

	getEnvironment(report) {
		const cpus = os.cpus();
		return [
			['Runtime', report.meta.environment.runtime],
			['Node.js', report.meta.environment.version],
			['Platform', `${report.meta.environment.platform} ${report.meta.environment.arch}`],
			['CPU', cpus[0]?.model || 'Unknown'],
			['CPU Cores', cpus.length],
			['Memory', `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(1)} GB`],
			['Luminara', report.meta.luminara.version],
			['Tinybench', report.meta.tinybench.version]
		];
	}

	generateHTML() {
		const report = this.latestReport;
		const allBenchmarks = this.getBenchmarks(report);
		const validBenchmarks = allBenchmarks.filter(bench => hasMetric(bench.result));
		const failedBenchmarks = allBenchmarks.filter(bench => !hasMetric(bench.result));
		const fastest = [...validBenchmarks].sort((a, b) => b.result.hz - a.result.hz).slice(0, 4);
		const microOps = validBenchmarks.filter(bench => bench.result.mean < 0.001).length;
		const networkBound = validBenchmarks.filter(bench => {
			const name = bench.name.toLowerCase();
			return name.includes('fetch') || name.includes('request') || name.includes('http verb') || name.includes('scenario');
		}).length;
		const generatedAt = new Date().toISOString();

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
			--warning: #f59e0b;
			--bg-dark: #1e1e1e;
			--bg-light: #2d2d2d;
			--text: #e4e4e7;
			--text-dim: #a1a1aa;
			--border: #3f3f46;
		}

		* { margin: 0; padding: 0; box-sizing: border-box; }

		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			background: linear-gradient(135deg, var(--bg-dark) 0%, var(--bg-light) 100%);
			color: var(--text);
			padding: 40px;
			line-height: 1.6;
		}

		.container { max-width: 1400px; margin: 0 auto; }
		header { text-align: center; margin-bottom: 40px; }

		h1 {
			font-size: 3rem;
			background: linear-gradient(135deg, var(--primary), var(--secondary));
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			margin-bottom: 10px;
		}

		.subtitle, .note, footer { color: var(--text-dim); }
		.subtitle { font-size: 1.1rem; }

		.summary-grid, .highlight-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
			gap: 20px;
			margin-bottom: 30px;
		}

		.summary-card, .highlight-card, .section {
			background: var(--bg-light);
			border: 1px solid var(--border);
			border-radius: 10px;
		}

		.summary-card, .highlight-card { padding: 24px; }
		.summary-label, .highlight-label { color: var(--text-dim); font-size: 0.9rem; margin-bottom: 8px; }
		.summary-value { font-size: 2rem; font-weight: 700; color: var(--primary); }
		.highlight-value { font-size: 1.5rem; font-weight: 700; color: var(--success); }
		.highlight-name { margin-top: 8px; color: var(--text-dim); font-size: 0.9rem; }

		.section { padding: 30px; margin-bottom: 30px; }
		h2 { font-size: 1.65rem; margin-bottom: 18px; }
		.note { margin-bottom: 18px; }

		table { width: 100%; border-collapse: collapse; }
		thead { background: var(--bg-dark); }
		th {
			padding: 14px;
			text-align: left;
			font-weight: 600;
			color: var(--text-dim);
			text-transform: uppercase;
			font-size: 0.8rem;
		}
		td { padding: 14px; border-bottom: 1px solid var(--border); }
		tbody tr:hover { background: rgba(99, 102, 241, 0.1); }

		.metric-highlight { color: var(--success); font-weight: 600; }
		.warning { color: var(--warning); font-weight: 600; }

		.category-badge {
			display: inline-block;
			padding: 4px 12px;
			border-radius: 20px;
			background: rgba(99, 102, 241, 0.2);
			color: var(--primary);
			font-size: 0.85rem;
			font-weight: 600;
		}

		.env-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
			gap: 12px 24px;
		}
		.env-row { display: flex; justify-content: space-between; gap: 20px; border-bottom: 1px solid var(--border); padding: 8px 0; }
		.env-key { color: var(--text-dim); }
		.env-value { text-align: right; }
		.chart-container { height: 420px; margin-top: 20px; }
		footer { text-align: center; margin-top: 50px; font-size: 0.9rem; }
	</style>
</head>
<body>
	<div class="container">
		<header>
			<h1>Luminara Benchmark Report</h1>
			<p class="subtitle">Report published ${formatDate(generatedAt)} from benchmark data captured ${formatDate(report.meta.timestamp)}</p>
		</header>

		<div class="summary-grid">
			<div class="summary-card">
				<div class="summary-label">Completed Benchmarks</div>
				<div class="summary-value">${validBenchmarks.length}</div>
			</div>
			<div class="summary-card">
				<div class="summary-label">Marked Failed</div>
				<div class="summary-value">${failedBenchmarks.length}</div>
			</div>
			<div class="summary-card">
				<div class="summary-label">Micro Operations</div>
				<div class="summary-value">${microOps}</div>
			</div>
			<div class="summary-card">
				<div class="summary-label">Luminara</div>
				<div class="summary-value">${escapeHTML(report.meta.luminara.version)}</div>
			</div>
		</div>

		<div class="section">
			<h2>Strongest Results</h2>
			<p class="note">Luminara's fastest internal operations run in nanoseconds to microseconds. Network-style tests include local mock-server, fetch, serialization, and event-loop overhead, so they should be read as end-to-end scenarios rather than pure library overhead.</p>
			<div class="highlight-grid">
				${fastest.map(bench => `
				<div class="highlight-card">
					<div class="highlight-label">${escapeHTML(bench.category)}</div>
					<div class="highlight-value">${formatOps(bench.result.hz)} ops/sec</div>
					<div class="highlight-name">${escapeHTML(bench.name)} · mean ${formatDuration(bench.result.mean)}</div>
				</div>`).join('')}
			</div>
			<p class="note">${networkBound} completed benchmarks are network-style or request scenarios; use them for relative overhead, not as raw network latency claims.</p>
		</div>

		<div class="section">
			<h2>Environment</h2>
			<div class="env-grid">
				${this.getEnvironment(report).map(([key, value]) => `
				<div class="env-row">
					<span class="env-key">${escapeHTML(key)}</span>
					<span class="env-value">${escapeHTML(value)}</span>
				</div>`).join('')}
			</div>
		</div>

		<div class="section">
			<h2>Benchmark Results</h2>
			<table>
				<thead>
					<tr>
						<th>Benchmark</th>
						<th>Category</th>
						<th>Mean</th>
						<th>Ops/sec</th>
						<th>P99</th>
						<th>Samples</th>
					</tr>
				</thead>
				<tbody>
					${validBenchmarks.map(bench => `
					<tr>
						<td>${escapeHTML(bench.name)}</td>
						<td><span class="category-badge">${escapeHTML(bench.category)}</span></td>
						<td>${formatDuration(bench.result.mean)}</td>
						<td class="metric-highlight">${formatOps(bench.result.hz)}</td>
						<td>${formatDuration(bench.result.p99)}</td>
						<td>${bench.result.sampleCount.toLocaleString()}</td>
					</tr>`).join('')}
				</tbody>
			</table>
		</div>

		${failedBenchmarks.length > 0 ? `
		<div class="section">
			<h2>Marked Failed</h2>
			<p class="note">These tasks produced no valid samples in the latest run, so they are excluded from charts and aggregate claims instead of being shown as NaN.</p>
			<table>
				<thead>
					<tr>
						<th>Benchmark</th>
						<th>Category</th>
						<th>Status</th>
					</tr>
				</thead>
				<tbody>
					${failedBenchmarks.map(bench => `
					<tr>
						<td>${escapeHTML(bench.name)}</td>
						<td><span class="category-badge">${escapeHTML(bench.category)}</span></td>
						<td class="warning">No valid samples</td>
					</tr>`).join('')}
				</tbody>
			</table>
		</div>` : ''}

		<div class="section">
			<h2>Top Operations per Second</h2>
			<div class="chart-container">
				<canvas id="opsChart"></canvas>
			</div>
		</div>

		<footer>
			<p>Generated by Luminara Benchmark Suite · Powered by Tinybench</p>
		</footer>
	</div>

	<script>
		const validBenchmarks = ${JSON.stringify(validBenchmarks)};
		const opsCtx = document.getElementById('opsChart').getContext('2d');
		const sortedResults = [...validBenchmarks].sort((a, b) => b.result.hz - a.result.hz).slice(0, 20);

		new Chart(opsCtx, {
			type: 'bar',
			data: {
				labels: sortedResults.map(result => result.name.substring(0, 50)),
				datasets: [{
					label: 'Operations per Second',
					data: sortedResults.map(result => Math.round(result.result.hz)),
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
								label: context => context.parsed.x.toLocaleString() + ' ops/sec'
						}
					}
				}
			}
		});
	</script>
</body>
</html>`;
	}
}

const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
	const generator = new HTMLReportGenerator();
	generator.generate();
}

export { HTMLReportGenerator };
