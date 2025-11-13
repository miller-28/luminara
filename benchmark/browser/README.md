# Browser Benchmarks

Interactive browser-based performance benchmarks for Luminara HTTP client.

## Quick Start

### Option 1: VS Code Debug (Recommended)

Press `F5` in VS Code and select:
```
Luminara - Run Browser Benchmarks
```

This will:
1. Start the development server on port 2880
2. Launch Chrome with debugging enabled
3. Open the browser benchmarks automatically

### Option 2: Manual Server

```powershell
# From project root
npx serve .
```

Then open: http://localhost:3000/benchmark/browser/

> **Note**: VS Code launch configuration (`Luminara - Run Browser Benchmarks`) automatically starts the server and opens Chrome with debugging support, making it easier to profile and troubleshoot benchmarks.

## What It Tests

### Core Benchmarks (`core.bench.js`)
- Factory creation overhead
- Client instantiation
- Configuration merging
- HTTP verb methods

### Driver Benchmarks (`driver.bench.js`)
- NativeFetchDriver request handling
- URL construction
- Request/response processing
- Error handling

### Feature Benchmarks (`features.bench.js`)
- Retry logic with backoff strategies
- Rate limiting (token bucket)
- Request deduplication
- Request debouncing
- Timeout handling

### Orchestration Benchmarks (`orchestration.bench.js`)
- Plugin pipeline execution
- Retry orchestrator
- Context building
- Signal management

### Integrated Benchmarks (`integrated.bench.js`)
- Real-world request scenarios
- Multiple features combined
- End-to-end performance

## How to Use

1. **Select Benchmarks**: Check/uncheck suites to run
2. **Run**: Click "Run Selected Benchmarks"
3. **View Results**: See ops/sec, mean time, and percentiles
4. **Compare**: Run multiple times to track performance

## Interpreting Results

- **ops/sec**: Higher is better (operations per second)
- **mean**: Lower is better (average time per operation)
- **p95/p99**: Measure tail latency (95th/99th percentile)

## Tips

- Close other browser tabs for accurate results
- Run benchmarks multiple times for consistency
- Compare results across different browsers
- Use Chrome DevTools Performance tab for deeper analysis

## Architecture

```
browser/
├── index.html       # UI and layout
├── styles.css       # Visual styling
├── runner.js        # Benchmark orchestrator
└── suites/          # Individual benchmark suites
    ├── core.bench.js
    ├── driver.bench.js
    ├── features.bench.js
    ├── orchestration.bench.js
    └── integrated.bench.js
```

## Notes

- Benchmarks run in the browser using native `fetch()` API
- Results may vary based on browser, CPU, and system load
- Not suitable for CI/CD - use headless benchmarks instead
- Great for interactive performance exploration and debugging
