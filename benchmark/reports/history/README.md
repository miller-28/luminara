# Benchmark History

This directory stores historical benchmark data with process statistics for CLI and headless benchmarks.

Each benchmark run generates a timestamped JSON file containing:
- Performance metrics (operations/sec, mean time, p99, etc.)
- Process statistics (memory usage, CPU time, heap size)
- Environment details (Node.js version, platform, architecture)
- Benchmark metadata (Luminara version, Tinybench version)

Files are automatically saved here when running:
- `npm run benchmark` (Node.js CLI benchmarks)
- `npm run benchmark:headless` (Headless browser benchmarks)

This historical data enables:
- Performance regression tracking over time
- Baseline comparisons against previous runs
- Trend analysis and visualization in HTML reports
