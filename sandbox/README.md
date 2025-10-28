# Luminara Sandbox

An interactive demo and testing environment for the Luminara HTTP client. This sandbox provides a beautiful, feature-rich UI to explore all Luminara capabilities with individual test controls and parallel execution.

## 📁 File Structure

The sandbox follows strict **separation of concerns**:

```
sandbox/
├── index.html          # HTML structure only
├── styles.css          # All styling (separated from HTML)
├── main.js             # UI rendering and event handling
├── testController.js   # Test execution logic
└── examples/           # Test definitions organized by feature
    ├── basicUsage.js
    ├── baseUrlAndQuery.js
    ├── timeout.js
    ├── retry.js
    ├── backoffStrategies.js
    ├── customRetry.js
    ├── plugins.js
    └── customDriver.js
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

## ✨ Features

- 🎯 **Individual Test Controls** - Run each example independently with dedicated buttons
- ⚡ **Parallel Execution** - All tests run in parallel, no more waiting for sequential execution
- 📊 **Organized by Feature** - Examples grouped into logical categories (Basic Usage, Retry, Backoff, Plugins, etc.)
- 🎨 **Modern UI** - Clean, responsive interface with color-coded outputs
- 📱 **Mobile Responsive** - Works beautifully on all screen sizes
- 🔍 **Real-time Feedback** - See test status (running/success/error) with informative output

## 📦 Test Categories

### 📦 Basic Usage
- GET JSON - Fetch and parse JSON data
- GET Text - Fetch plain text responses
- POST JSON - Send JSON data to server
- POST Form Data - Submit form-encoded data

### 🔗 Base URL & Query Parameters
- Using Base URL - Configure default base URL for all requests
- Query Parameters - Add query strings to requests

### ⏱️ Timeout
- Timeout Success - Request completes within timeout
- Timeout Failure - Request exceeds timeout limit

### 🔄 Retry Logic
- Basic Retry - Simple retry with fixed delay
- Retry with Status Codes - Retry only on specific HTTP status codes

### 📈 Backoff Strategies
- Linear Backoff - Fixed delay between retries
- Exponential Backoff - Exponentially increasing delays (2^n)
- Exponential Capped - Exponential with maximum delay cap
- Fibonacci Backoff - Delays follow Fibonacci sequence
- Jitter Backoff - Randomized delays to prevent thundering herd
- Exponential Jitter - Combines exponential growth with randomization

### ⚙️ Custom Retry Handler
- Custom onRetry - Implement custom retry logic that overrides backoff strategies

### 🔌 Plugin System
- Request Interceptor - Modify requests before they're sent
- Response Transformer - Transform responses after they arrive
- Error Handler - Handle and log errors through plugins

### 🚗 Custom Driver
- Browser Fetch Driver - Use native fetch instead of ofetch

## 🎮 Controls

- **▶️ Run All Examples** - Execute all tests in parallel
- **▶️ Run All [N]** - Run all tests within a specific feature category
- **▶️** (Individual) - Run a single test
- **🗑️ Clear All** - Reset all output windows

## How to Run

### Method 1: VS Code Debugging (Recommended)

The repository includes pre-configured VS Code debug settings in `.vscode/`:

- **`launch.json`** - Chrome debug configuration that:
  - Launches Chrome at `http://localhost:2880/sandbox/`
  - Enables source mapping for debugging
  - Automatically runs the `serve-sandbox` task before launching

- **`tasks.json`** - Background task that:
  - Runs `npx serve .` to serve the project root
  - Sets `PORT=2880` for consistent port usage
  - Detects when the server is ready before launching Chrome

**To debug:**
1. Open the project in VS Code
2. Press `F5` or click "Run and Debug" → "Debug Luminara Sandbox"
3. VS Code will:
   - Start the serve task on port 2880
   - Launch Chrome with debugging enabled
   - Navigate to the sandbox page
4. Click "Run demo" to test the Luminara client
5. Set breakpoints in the source files to debug

### Method 2: Manual Server

If you prefer to run the server manually:

```bash
npx serve .
```

Then open `http://localhost:3000/sandbox/` (or the port shown in the terminal) in your browser.

## What It Does

The sandbox demonstrates different ways to create and use the Luminara client:

1. **Default client** - Using `createLuminara()` with ofetch driver
2. **Explicit OfetchDriver** - Manually creating a client with ofetch
3. **Custom BrowserDriver** - Using native `fetch` API directly

It includes example plugin usage for request/response interceptors and error handling.

## Technical Notes

- **Import Map**: The `index.html` includes an import map that maps `ofetch` to the CDN version from esm.sh, allowing the sandbox to work without a build step
- **Tab Indentation**: Files use tabs with a tab size of 4 for consistency
- **Favicon**: Uses an inline SVG data URL with the 🌌 emoji to avoid an additional file request

## VS Code Configuration

The `.vscode/` folder is committed to the repository, so anyone who clones this project will get the same debugging experience out of the box. No additional setup required!

