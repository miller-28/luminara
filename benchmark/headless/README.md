# Luminara Headless Browser Benchmarks

Automated cross-browser performance testing using Playwright.

## 🎯 Purpose

Run Luminara benchmarks across multiple browsers (Chromium, Firefox, WebKit) in headless mode for:
- Cross-browser performance comparison
- CI/CD integration
- Automated regression testing
- Multi-browser baseline establishment

## 📋 Prerequisites

**1. Playwright Installation:**

```powershell
# From benchmark directory
cd benchmark
npm install

# Install browser binaries (required first time)
npx playwright install
```

**2. Development Server:**

The headless runner requires the benchmark server to be running:

```powershell
# From benchmark directory (or project root)
npm run serve
```

Server must be accessible at `http://localhost:2880`

## 🚀 Usage

### Option 1: VS Code Debug (Recommended)

Press `F5` in VS Code and select:
```
Luminara - Run Headless Benchmarks
```

This will:
1. Start the development server on port 2880
2. Run Playwright benchmarks across all browsers (Chromium, Firefox, WebKit)
3. Display cross-browser comparison table
4. Save results to `benchmark/reports/headless-latest.json`

> **Note**: The VS Code launch configuration automatically starts the server and runs the full benchmark suite with proper debugging support.

### Option 2: Command Line

```powershell
# From project root
cd benchmark
npm run benchmark:headless
```

**Important**: Ensure the development server is running first:
```powershell
npm run serve
```

### What It Does

1. **Checks Playwright Installation** - Displays helpful notice if not installed
2. **Launches 3 Browsers** - Chromium, Firefox, WebKit in headless mode
3. **Runs Benchmarks** - Executes all browser benchmarks in each browser
4. **Generates Report** - Cross-browser comparison table + JSON report
5. **Saves Results** - `benchmark/reports/headless-latest.json`

### Output Example

```
╔══════════════════════════════════════════════════════════════╗
║      LUMINARA HEADLESS BROWSER BENCHMARK SUITE               ║
╚══════════════════════════════════════════════════════════════╝

🌐 Running benchmarks in chromium...
✅ Completed 3 benchmarks in chromium

🌐 Running benchmarks in firefox...
✅ Completed 3 benchmarks in firefox

🌐 Running benchmarks in webkit...
✅ Completed 3 benchmarks in webkit


📊 CROSS-BROWSER COMPARISON
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Benchmark                               chromium            firefox             webkit
────────────────────────────────────────────────────────────────────────────────────────
createLuminara()                        1.2M ops/s          980K ops/s          1.1M ops/s
api.use() - 1 plugin                    850K ops/s          720K ops/s          800K ops/s
api.updateConfig()                      1.5M ops/s          1.3M ops/s          1.4M ops/s
Hedging - Race policy                   45 ops/s            42 ops/s            44 ops/s
Hedging - Cancel-and-retry              48 ops/s            45 ops/s            47 ops/s
Hedging - Exponential backoff           40 ops/s            38 ops/s            41 ops/s

📁 Report saved: benchmark/reports/headless-latest.json
```

## 🎯 Benchmarks Included

The headless suite runs the following benchmarks across all browsers:

### Core Benchmarks (Synchronous)
- `createLuminara()` - Client instantiation
- `api.use() - 1 plugin` - Plugin registration
- `api.updateConfig()` - Configuration updates

### Hedging Benchmarks (Asynchronous with Network)
- **Race Policy** - Concurrent requests, first wins
- **Cancel-and-Retry** - Sequential with cancellation
- **Exponential Backoff** - Race policy with backoff + jitter

> **Note**: Hedging benchmarks use real network requests to `jsonplaceholder.typicode.com`, so ops/sec will be significantly lower than sync operations.

## 🔧 Troubleshooting

### Error: "Playwright not installed"

```powershell
cd benchmark
npm install
npx playwright install
```

### Error: "net::ERR_CONNECTION_REFUSED"

Start the development server:

```powershell
npm run serve
```

### Error: "Timeout waiting for window.Bench"

Ensure Luminara is built:

```powershell
# From project root
npm run build
```

## 📊 Report Output

Results are saved to `benchmark/reports/headless-latest.json`:

```json
{
  "timestamp": "2025-11-12T10:30:00.000Z",
  "browsers": {
    "chromium": [
      {
        "name": "createLuminara()",
        "mean": 0.00083,
        "hz": 1204819.27,
        "p99": 0.0012
      }
    ],
    "firefox": [...],
    "webkit": [...]
  }
}
```

## 🎨 Customization

Edit `headless/index.js` to:
- Add/remove browsers
- Modify benchmark duration
- Change warmup time
- Add custom benchmarks
- Adjust report format

## 🔗 Integration

### CI/CD Pipeline

```yaml
# Example GitHub Actions
- name: Run Headless Benchmarks
  run: |
    cd benchmark
    npm install
    npx playwright install --with-deps
    npm run serve &
    sleep 5
    npm run benchmark:headless
```

## 📚 Related

- **Browser UI**: `npm run benchmark:browser` - Interactive browser interface
- **Node.js**: `npm run benchmark` - Full Node.js benchmark suite
