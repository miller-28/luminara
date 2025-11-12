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

### Quick Start

```powershell
# From project root
cd benchmark
npm run benchmark:headless
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

📁 Report saved: benchmark/reports/headless-latest.json
```

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

### Baseline Comparison

Use with `scripts/track-regression.js`:

```powershell
npm run benchmark:headless
npm run benchmark:regression
```

## 📚 Related

- **Browser UI**: `npm run benchmark:browser` - Interactive browser interface
- **Node.js**: `npm run benchmark` - Full Node.js benchmark suite
- **Comparison**: `npm run benchmark:compare` - Compare saved results
