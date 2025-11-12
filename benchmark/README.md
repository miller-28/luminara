# Luminara Benchmark Suite

Comprehensive performance benchmarking for Luminara HTTP client using [Tinybench](https://github.com/tinylibs/tinybench).

## 📦 Features

- **Node.js Benchmarks**: High-precision benchmarks with memory profiling
- **Browser Benchmarks**: Interactive browser-based testing with visualizations
- **Headless Testing**: Multi-browser benchmarking (Chromium, Firefox, WebKit)
- **Regression Tracking**: Historical performance analysis and regression detection
- **Beautiful Reports**: HTML reports with charts and trends

## 🚀 Quick Start

### Node.js Benchmarks

```powershell
# Install dependencies
npm install

# Run all benchmarks
npm run benchmark

# Run specific category
npm run benchmark:core
npm run benchmark:orchestration
npm run benchmark:driver
npm run benchmark:features
npm run benchmark:integrated

# Run with memory profiling
npm run benchmark:memory

# Save baseline for comparison
npm run benchmark -- --save-baseline

# Compare against baseline
npm run benchmark:compare
```

### Browser Benchmarks

1. Start the development server:
   ```powershell
   # From project root
   npm run dev
   ```

2. Open browser benchmark page:
   ```
   http://localhost:2880/benchmark/browser/index.html
   ```

3. Click "Run All Benchmarks" and view interactive results with charts

### Headless Browser Benchmarks

```powershell
# Run benchmarks across all browsers
npm run benchmark:headless

# Results: Comparative analysis across Chromium, Firefox, WebKit
```

## 📊 Reporting & Analysis

### Generate HTML Report

```powershell
npm run benchmark:report
```

Opens beautiful HTML report with:
- Summary statistics
- Interactive charts
- Performance trends
- Historical comparisons

### Track Regressions

```powershell
npm run benchmark:regression
```

Analyzes last 5 runs and detects:
- Performance regressions (>15% slower)
- Performance improvements (>15% faster)
- Severity levels (MINOR, MAJOR, CRITICAL)

### Compare Against Baseline

```powershell
# Save current results as baseline
npm run benchmark -- --save-baseline

# Compare new run against baseline
npm run benchmark:compare
```

## 🎯 Benchmark Categories

### Core Benchmarks
- `createLuminara()` cold/warm start
- Plugin registration (1, 10 plugins)
- Config updates (simple, complex)

### Orchestration Benchmarks
- PluginPipeline execution (empty, 1, 5, 10 plugins)
- ContextBuilder (simple, complex requests)
- SignalManager (create, merge signals)
- Full request lifecycle with/without instrumentation

### Driver Benchmarks
- Request phases (Pre-Flight, In-Flight, Post-Flight)
- Response parsing (JSON small/medium/large, text, blob)
- Timeout handling
- Query parameter handling

### Feature Benchmarks
- Retry strategies (all backoff algorithms)
- Rate limiting enforcement
- Stats system queries
- Request deduplication
- Debouncing

### Integrated Scenarios
- Bare minimum GET request
- GET with retry
- GET with stats collection
- GET with 1/3 plugins
- All features enabled
- 10/50 concurrent requests
- 10 sequential requests
- Mixed HTTP methods
- Large payload handling (100KB, 1MB)

## 📈 Sample Output

```
╔══════════════════════════════════════════════════════════════╗
║           LUMINARA PERFORMANCE BENCHMARK SUITE               ║
║                     Node.js v22.14.0                         ║
║                   Luminara v0.10.0                           ║
╚══════════════════════════════════════════════════════════════╝

📊 Core Benchmarks
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────┬────────────┬────────────┬──────────────┐
│ Benchmark               │ Mean       │ P99        │ Ops/sec      │
├─────────────────────────┼────────────┼────────────┼──────────────┤
│ createLuminara() cold   │ 5.22 μs    │ 19.60 μs   │ 191K ops/s   │
│ api.use() 1 plugin      │ 113 ns     │ 245 ns     │ 8.9M ops/s   │
│ api.updateConfig()      │ 106 ns     │ 210 ns     │ 9.4M ops/s   │
└─────────────────────────┴────────────┴────────────┴──────────────┘
```

## 🔧 Configuration

Edit `benchmark/config.js` to customize:

```javascript
export const benchmarkConfig = {
  tinybench: {
    time: 1000,        // Benchmark duration (ms)
    iterations: 10,    // Minimum iterations
    warmupTime: 100,   // Warmup duration (ms)
  },
  mockServer: {
    port: 9999,
    latency: 0,        // Zero-latency for isolated testing
  },
  memory: {
    enabled: true,
    gcBetweenSuites: true
  }
};
```

## 📝 Adding New Benchmarks

1. Create benchmark file in `node/suites/`:

```javascript
export const myBenchmarks = [
  {
    name: 'My benchmark',
    fn: async () => {
      // Your benchmark code
    }
  }
];
```

2. Register in `node/index.js`:

```javascript
import { myBenchmarks } from './suites/my.bench.js';
runner.registerSuite('my-category', myBenchmarks);
```

3. Add npm script in `package.json`:

```json
{
  "scripts": {
    "benchmark:my-category": "node --expose-gc node/index.js --category=my-category"
  }
}
```

## 🎨 Browser Benchmark Features

- Real-time execution
- Interactive charts (Chart.js)
- Category filtering
- Beautiful dark theme UI
- Responsive design
- Memory usage tracking

## 🔍 Regression Detection

Automatically detects:
- **CRITICAL**: >30% performance change
- **MAJOR**: 20-30% performance change
- **MINOR**: 15-20% performance change

Exit codes:
- `0`: No regressions or only minor
- `1`: Major or critical regressions detected

Perfect for CI/CD integration!

## 📦 Dependencies

- **tinybench**: ^2.9.0 - Benchmarking engine
- **chalk**: ^5.3.0 - Terminal colors
- **cli-table3**: ^0.6.5 - Beautiful tables
- **commander**: ^12.1.0 - CLI interface
- **@playwright/test**: ^1.48.2 - Headless browser testing
- **Chart.js**: ^4.4.0 - Browser visualizations (CDN)

## 🤝 Contributing

When adding benchmarks:
1. Use descriptive names
2. Test in isolation (zero mock server latency)
3. Include memory profiling for heavy operations
4. Add to appropriate category
5. Update this README

## 📄 License

Same as Luminara - MIT License
