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

	getClientComparison(validBenchmarks) {
		const comparisons = validBenchmarks
			.filter(bench => bench.category === 'comparison' && bench.name.startsWith('Compare - '))
			.map(bench => {
				const label = bench.name.replace('Compare - ', '');
				const match = label.match(/^(native fetch|luminara|axios|ky|ofetch|got) (.+)$/);

				return {
					...bench,
					client: match?.[1] || 'unknown',
					scenario: match?.[2] || label
				};
			});

		const baselineByScenario = new Map(
			comparisons
				.filter(bench => bench.client === 'native fetch')
				.map(bench => [bench.scenario, bench.result.hz])
		);

		return comparisons.map(bench => {
			const baseline = baselineByScenario.get(bench.scenario);
			const relativeToFetch = baseline ? bench.result.hz / baseline : null;

			return {
				...bench,
				relativeToFetch,
				relativeLabel: relativeToFetch ? `${(relativeToFetch * 100).toFixed(1)}%` : 'baseline'
			};
		});
	}

	renderClientComparison(comparisons) {
		if (comparisons.length === 0) {
			return '';
		}

		return `
		<div class="section">
			<h2>Client Comparison</h2>
			<p class="note">These scenarios compare Luminara with native fetch, Axios, Ky, ofetch, and Got against the same local mock server. Retries are disabled where libraries enable them by default, so this measures simple request overhead plus parsing.</p>
			<table>
				<thead>
					<tr>
						<th>Scenario</th>
						<th>Client</th>
						<th>Mean</th>
						<th>Ops/sec</th>
						<th>vs native fetch</th>
						<th>P99</th>
					</tr>
				</thead>
				<tbody>
					${comparisons.map(bench => `
					<tr class="${bench.client === 'luminara' ? 'luminara-row' : ''}">
						<td>${escapeHTML(bench.scenario)}</td>
						<td>${bench.client === 'luminara' ? '<span class="client-mark">Luminara</span>' : escapeHTML(bench.client)}</td>
						<td>${formatDuration(bench.result.mean)}</td>
						<td class="metric-highlight">${formatOps(bench.result.hz)}</td>
						<td>${bench.relativeLabel}</td>
						<td>${formatDuration(bench.result.p99)}</td>
					</tr>`).join('')}
				</tbody>
			</table>
		</div>`;
	}

	generateHTML() {
		const report = this.latestReport;
		const allBenchmarks = this.getBenchmarks(report);
		const validBenchmarks = allBenchmarks.filter(bench => hasMetric(bench.result));
		const failedBenchmarks = allBenchmarks.filter(bench => !hasMetric(bench.result));
		const fastest = [...validBenchmarks].sort((a, b) => b.result.hz - a.result.hz).slice(0, 4);
		const clientComparisons = this.getClientComparison(validBenchmarks);
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
			--violet: #7c3aed;
			--blue: #2563eb;
			--cyan: #06b6d4;
			--green: #10b981;
			--amber: #f59e0b;
			--rose: #fb7185;
			--ink: #101114;
			--panel: #181a20;
			--panel-soft: #20232b;
			--text: #f4f7fb;
			--text-dim: #aab2c0;
			--border: #343946;
			--luminara: #c4b5fd;
		}

		* { margin: 0; padding: 0; box-sizing: border-box; }

		body {
			font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			background:
				radial-gradient(circle at 18% 0%, rgba(124, 58, 237, 0.24), transparent 34%),
				radial-gradient(circle at 82% 12%, rgba(6, 182, 212, 0.16), transparent 30%),
				linear-gradient(135deg, #0f1117 0%, #171922 48%, #101114 100%);
			color: var(--text);
			padding: 36px;
			line-height: 1.6;
		}

		.container { max-width: 1400px; margin: 0 auto; }
		header {
			position: relative;
			overflow: hidden;
			margin-bottom: 28px;
			padding: 44px;
			border: 1px solid rgba(196, 181, 253, 0.28);
			border-radius: 18px;
			background:
				linear-gradient(135deg, rgba(124, 58, 237, 0.24), rgba(37, 99, 235, 0.10)),
				rgba(16, 17, 20, 0.82);
			box-shadow: 0 24px 80px rgba(0, 0, 0, 0.32);
		}

		h1 {
			font-size: clamp(2.3rem, 5vw, 4.6rem);
			line-height: 1;
			letter-spacing: 0;
			background: linear-gradient(135deg, #ffffff, var(--luminara) 48%, #67e8f9);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			margin-bottom: 10px;
		}

		.subtitle, .note, footer { color: var(--text-dim); }
		.subtitle { font-size: 1.1rem; }
		.kicker {
			display: inline-flex;
			margin-bottom: 14px;
			color: #67e8f9;
			font-size: 0.78rem;
			font-weight: 800;
			letter-spacing: 0.08em;
			text-transform: uppercase;
		}

		.summary-grid, .highlight-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
			gap: 20px;
			margin-bottom: 30px;
		}

		.summary-card, .highlight-card, .section {
			background: rgba(24, 26, 32, 0.88);
			border: 1px solid var(--border);
			border-radius: 12px;
			box-shadow: 0 12px 34px rgba(0, 0, 0, 0.20);
		}

		.summary-card, .highlight-card { padding: 24px; }
		.summary-label, .highlight-label { color: var(--text-dim); font-size: 0.9rem; margin-bottom: 8px; }
		.summary-value { font-size: 2rem; font-weight: 800; color: var(--luminara); }
		.highlight-value { font-size: 1.5rem; font-weight: 800; color: var(--green); }
		.highlight-name { margin-top: 8px; color: var(--text-dim); font-size: 0.9rem; }

		.section { padding: 30px; margin-bottom: 30px; }
		h2 { font-size: 1.65rem; margin-bottom: 18px; }
		.note { margin-bottom: 18px; }

		table { width: 100%; border-collapse: collapse; }
		thead { background: #11131a; }
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

		.metric-highlight { color: var(--green); font-weight: 700; }
		.warning { color: var(--amber); font-weight: 700; }
		.luminara-row {
			background: linear-gradient(90deg, rgba(124, 58, 237, 0.22), rgba(6, 182, 212, 0.08));
			box-shadow: inset 4px 0 0 var(--luminara);
		}
		.client-mark {
			display: inline-flex;
			align-items: center;
			padding: 4px 10px;
			border-radius: 999px;
			background: rgba(196, 181, 253, 0.16);
			color: #ddd6fe;
			font-weight: 800;
		}

		.category-badge {
			display: inline-block;
			padding: 4px 12px;
			border-radius: 20px;
			background: rgba(124, 58, 237, 0.20);
			color: var(--luminara);
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
		.lens {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
			gap: 16px;
			margin-bottom: 30px;
		}
		.lens-card {
			padding: 18px 20px;
			border: 1px solid rgba(196, 181, 253, 0.24);
			border-radius: 12px;
			background: rgba(16, 17, 20, 0.58);
		}
		.lens-card strong { display: block; margin-bottom: 6px; color: #ffffff; }
		.lens-card span { color: var(--text-dim); }
		@media (max-width: 720px) {
			body { padding: 18px; }
			header { padding: 28px 22px; }
			.section { padding: 20px; overflow-x: auto; }
			table { min-width: 760px; }
		}
	</style>
</head>
<body>
	<div class="container">
		<header>
			<span class="kicker">Luminara performance lab</span>
			<h1>Luminara Benchmark Report</h1>
			<p class="subtitle">Report published ${formatDate(generatedAt)} from benchmark data captured ${formatDate(report.meta.timestamp)}</p>
		</header>

		<div class="lens">
			<div class="lens-card">
				<strong>Built for the fetch era</strong>
				<span>Luminara is compared against native fetch, Ky, and ofetch as its closest browser-style peers.</span>
			</div>
			<div class="lens-card">
				<strong>Distinctive feature surface</strong>
				<span>Retries, hedging, rate limits, deduplication, stats, and plugins are part of the benchmark story.</span>
			</div>
			<div class="lens-card">
				<strong>Honest measurement</strong>
				<span>Failed tasks are marked separately and network-style tests are framed as end-to-end local scenarios.</span>
			</div>
		</div>

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

		${this.renderClientComparison(clientComparisons)}

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
