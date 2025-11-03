# Luminara Sandbox

An interactive demo environment for exploring **Luminara**, the powerful yet lightweight HTTP client for modern JavaScript applications. This sandbox provides a comprehensive, feature-rich interface to test and understand all Luminara capabilities with real-time execution and detailed output.

> **🌐 Universal Compatibility**: Luminara works seamlessly across all modern JavaScript environments - React, Vue, Angular, Svelte, Node.js, and vanilla JavaScript. This sandbox demonstrates pure JavaScript usage, but the API is identical everywhere.

## 🚀 **Quick Start**

### **Step 1: Build Required**
The sandbox imports the built Luminara distribution. Build first:

```powershell
# From project root (not sandbox folder)
npm run build
```

### **Step 2: Run Sandbox**

**Option A - VS Code Debugging (Recommended):**
1. Open project in VS Code
2. Press `F5` or "Run and Debug" → "Debug Luminara Sandbox"
3. Chrome launches automatically with debugging enabled

**Option B - Manual Server:**
```powershell
npx serve .
# Open http://localhost:3000/sandbox/
```

## ✨ Features

- **🎯 Individual Controls** - Run each example independently with dedicated buttons
- **⚡ Parallel Execution** - All examples execute concurrently with real-time progress
- **📊 Feature Organization** - Examples grouped by functionality (Basic, Retry, Backoff, etc.)
- **🎨 Modern Interface** - Clean, responsive design with color-coded status indicators
- **📱 Mobile Responsive** - Optimized for all screen sizes
- **🔍 Live Feedback** - Real-time status updates with detailed execution output
- **🛑 Cancellation Support** - Abort any running request with individual stop buttons
- **🌐 Framework-Agnostic** - Pure JavaScript demonstrating universal API compatibility

## 📦 Example Categories

### 📦 **Basic Usage**
Core HTTP operations with Luminara's helper methods:
- **GET JSON** - Fetch and automatically parse JSON responses
- **GET Text** - Retrieve plain text content  
- **POST JSON** - Send JSON payloads with automatic serialization
- **POST Form Data** - Submit form-encoded data

### 🔗 **Base URL & Query Parameters**
Configuration and URL handling:
- **Base URL Setup** - Configure default base URL for all requests
- **Query Parameters** - Add and manage URL query strings

### ⏱️ **Timeout Management**
Request timeout scenarios:
- **Timeout Success** - Request completes within timeout window
- **Timeout Failure** - Request exceeds configured timeout limit

### 🔄 **Retry Logic**
Comprehensive retry mechanisms:
- **Basic Retry** - Simple retry with configurable attempts
- **Retry with Status Codes** - Conditional retry based on HTTP status
- **Custom retryDelay Function** - Dynamic delay calculation
- **Default Retry Policy** - Automatic retry for idempotent methods
- **Custom Retry Policy Override** - Define custom retry conditions
- **Retry Status Code Policies** - Granular control over retry triggers

### 📈 **Backoff Strategies**
Advanced retry delay patterns:
- **Linear Backoff** - Fixed delay intervals between retries
- **Exponential Backoff** - Exponentially increasing delays (2^n pattern)
- **Exponential Capped** - Exponential growth with maximum delay limit
- **Fibonacci Backoff** - Delays following Fibonacci sequence progression
- **Jitter Backoff** - Randomized delays to prevent thundering herd
- **Exponential Jitter** - Combines exponential growth with randomization

### 📦 **Response Type Options**
Response parsing and handling:
- **responseType: "text"** - Force text parsing for any response
- **responseType: "json"** - Force JSON parsing with error handling
- **responseType: "blob"** - Handle binary data as Blob objects
- **responseType: "stream"** - Process responses as ReadableStream
- **responseType: "arrayBuffer"** - Access raw binary data
- **responseType: "auto"** - Automatic type detection (default)
- **Default Behavior** - Smart content-type based parsing

### 🔌 **Interceptors**
Powerful request/response interception system:
- **Request Interceptor** - Modify requests before transmission
- **Response Interceptor** - Transform responses after receipt
- **Error Interceptor** - Handle and process errors globally
- **Deterministic Execution Order** - Guaranteed interceptor sequence
- **Shared Context** - Pass data between interceptors via context.meta
- **Retry-Aware Authentication** - Token refresh on retry attempts
- **Conditional Processing** - Dynamic interceptor behavior

### 🛠️ **Error Handling**
Comprehensive error management:
- **HTTP Error with JSON Data** - Structured server error responses
- **Network Error** - Connection failure handling
- **Timeout Error** - Request timeout scenarios
- **Abort Error** - Manual request cancellation
- **Error Tracking Across Retries** - Error state through retry attempts
- **Ignore Response Errors** - Bypass error throwing with ignoreResponseError

### 🚗 **Custom Driver**
Driver extensibility demonstration:
- **Browser Fetch Driver** - Custom HTTP driver implementation

## 🏗️ Architecture

### **Separation of Concerns**
The sandbox follows strict architectural principles:

```
sandbox/
├── index.html            # 📄 HTML structure only
├── styles.css            # � All styling (no inline styles)
├── main.js               # 🖥️ UI rendering and DOM event handling
├── examplesController.js # 📋 Examples controller implementation
└── examples/             # 📁 Feature-organized example definitions
    ├── basicUsage.js        # 📦 Core HTTP operations
    ├── baseUrlAndQuery.js   # 🔗 URL configuration
    ├── timeout.js           # ⏱️ Timeout scenarios
    ├── retry.js             # 🔄 Retry mechanisms
    ├── backoffStrategies.js # 📈 Backoff algorithms
    ├── responseTypes.js     # 📦 Response parsing options
    ├── interceptors.js      # 🔌 Interceptor patterns
    ├── errorHandling.js     # 🛠️ Error scenarios
    └── customDriver.js      # 🚗 Driver extensibility
```

### **Layer Responsibilities**

- **Presentation Layer** (`styles.css`) - Visual design, responsive layout, animations
- **UI Layer** (`main.js`) - DOM manipulation, event handling, rendering logic
- **Business Logic** (`*Controller.js`) - Example execution, state management, orchestration
- **Data Layer** (`examples/*.js`) - Example definitions, configurations, test cases

### **Example Structure**
All examples follow consistent patterns:

```javascript
export const featureName = {
  title: "🔍 Feature Category",
  examples: [
    {
      id: "unique-example-id",
      title: "Descriptive Example Name",
      run: async (updateOutput, signal) => {
        // Example implementation with:
        // - updateOutput() for progress logging
        // - signal for cancellation support
        // - Return value for final result display
      }
    }
  ]
};
```

## 🎮 Interactive Controls

### **Global Actions**
- **▶️ Run All Examples** - Execute all examples across all categories in parallel
- **🗑️ Clear All** - Reset all output windows and status indicators

### **Feature-Level Actions**
- **▶️ Run All [N]** - Execute all examples within a specific feature category
- **Feature sections** - Collapsible organization for better navigation

### **Individual Example Actions**
- **▶️ Run** - Execute a single example with real-time output
- **🛑 Stop** - Cancel a running example (AbortController support)
- **Status Indicators** - Visual feedback (Running, Success, Error, Stopped)

### **Output Management**
- **Real-time Updates** - Live progress logging during example execution
- **Result Display** - Final results with formatted output
- **Error Details** - Comprehensive error information with stack traces
- **Color Coding** - Visual status differentiation (green=success, red=error, etc.)

## 🔧 Technical Details

### **Import Configuration**
- **Built Distribution** - Sandbox imports from `../../dist/index.mjs`
- **ES Modules** - Native browser module support without bundling
- **No Dependencies** - Standalone sandbox with minimal external requirements

### **Browser Compatibility**
- **Modern Browsers** - ES2020+ features (async/await, modules, AbortController)
- **Mobile Support** - Responsive design for mobile testing
- **Developer Tools** - Full debugging support with source maps

### **Development Features**
- **VS Code Integration** - Pre-configured debugging with `.vscode/launch.json`
- **Hot Reload Ready** - File watching during development
- **Source Maps** - Debug original TypeScript/JavaScript source
- **Port Configuration** - Consistent development server setup

### **Performance Characteristics**
- **Parallel Execution** - Non-blocking example execution
- **Efficient DOM Updates** - Optimized rendering for large result sets
- **Memory Management** - Proper cleanup of AbortControllers and event handlers
- **Responsive UI** - Smooth interactions even during heavy network activity

## 🌐 Framework Integration

While this sandbox uses pure JavaScript, Luminara integrates identically across all frameworks:

```javascript
// React Hook Example
const { data, loading, error } = useLuminara('/api/users');

// Vue Composition API Example  
const { data, loading, error } = await api.getJson('/api/users');

// Angular Service Example
constructor(private api: LuminaraService) {}
async loadUsers() { return await this.api.getJson('/api/users'); }

// Svelte Store Example
const users = await $api.getJson('/api/users');
```

The sandbox demonstrates the universal API that works consistently across all these environments.

## 🎯 Learning Path

**Recommended exploration order:**

1. **📦 Basic Usage** - Start with core HTTP operations
2. **🔗 Base URL & Query** - Learn configuration patterns  
3. **⏱️ Timeout** - Understand timeout handling
4. **🔄 Retry** - Explore retry mechanisms
5. **📈 Backoff Strategies** - Master advanced retry patterns
6. **📦 Response Types** - Learn response handling options
7. **🔌 Interceptors** - Implement request/response middleware
8. **🛠️ Error Handling** - Master comprehensive error scenarios
9. **🚗 Custom Driver** - Explore extensibility options

Each category builds upon previous concepts, providing a comprehensive understanding of Luminara's capabilities.

---

**🚀 Ready to explore? Run `npm run build` then open the sandbox and start with Basic Usage!**

