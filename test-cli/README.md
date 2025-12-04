# Luminara Testing Environment

This testing environment programmatically validates all Luminara features as they would be used in real JavaScript applications across all frameworks.

> **🌐 Framework-Agnostic Testing**: While some tests simulate React-like patterns, Luminara works identically across React, Vue, Angular, Svelte, vanilla JavaScript, and any modern browser environment.

## 🧪 Test Structure

```
test-cli/
├── package.json           # Test environment dependencies
├── testRunner.js          # Main test runner
├── testUtils.js           # Shared testing utilities
├── tests/
│   ├── basic.test.js      # Basic HTTP operations
│   ├── retry.test.js      # Retry system validation
│   ├── backoff.test.js    # All backoff strategies
│   ├── rateLimit.test.js  # Rate limiting with token bucket algorithm
│   ├── debouncer.test.js  # Request debouncing validation
│   ├── deduplicator.test.js  # Request deduplication tests
│   ├── interceptors.test.js    # Interceptor system tests
│   ├── timeout.test.js    # Timeout and abort scenarios
│   ├── drivers.test.js    # Custom driver tests
│   ├── stats.test.js      # Statistics system validation
│   ├── errors.test.js     # Error handling tests
│   ├── responseTypes.test.js   # Response type handling
│   ├── parseResponse.test.js   # Response parsing validation
│   └── reactSimulation.test.js  # Framework usage patterns
└── README.md              # This file
```

## 🚀 Quick Start

```bash
# Install test dependencies
cd test-cli
npm install

# Run all tests
npm test

# Run specific test suites
npm run test:basic
npm run test:retry
npm run test:backoff
npm run test:rate-limit
npm run test:debouncer
npm run test:deduplicator
npm run test:interceptors
npm run test:timeout
npm run test:drivers
npm run test:stats
npm run test:errors
npm run test:response-types
npm run test:parse-response
npm run test:react-simulation

# Watch mode for development
npm run test:watch
```

## ✅ Test Coverage

### Basic HTTP Operations
- GET/POST/PUT/PATCH/DELETE methods
- JSON/Text/Form data handling
- Base URL configuration
- Query parameters
- Custom headers

### Retry & Backoff Strategies
- Linear backoff timing validation
- Exponential backoff growth patterns
- Fibonacci sequence verification
- Jitter randomization bounds
- Exponential jitter combinations
- Custom retry handlers
- Status code filtering

### Request Hedging
- Race policy (concurrent requests)
- Cancel-and-retry policy (sequential with cancellation)
- HTTP method whitelist validation (GET/HEAD/OPTIONS)
- Exponential backoff timing for hedges
- Jitter randomization for hedge delays
- Per-request override (bidirectional)
- Server rotation support
- Integration with retry and timeout
- Stats tracking for hedging metrics
- Edge cases (errors, short delays, maxHedges limits)

### Rate Limiting
- Token bucket algorithm validation
- Burst capacity enforcement
- Request scheduling behavior
- Global/domain/endpoint scoping
- Pattern-based include/exclude rules
- Statistics tracking accuracy
- Dynamic configuration updates

### Debouncer
- Search-as-you-type patterns (300ms delay)
- Button click spam protection
- Method-specific debouncing (GET only)
- Custom key generation strategies
- Request cancellation behavior
- Delay configuration validation
- Stats integration accuracy
- Debouncer + retry interaction

### Request Deduplicator
- Disabled by default verification
- Basic deduplication (3→1 request)
- Key strategy validation (url vs url+method)
- Method filtering (excludeMethods/methods)
- Cache TTL burst protection (100ms default)
- Cache TTL = 0 (in-flight only mode)
- Per-request disable override
- Custom key generator functions
- Error propagation to duplicates
- AbortController integration
- Sequential request behavior
- Integration with retry logic
- maxCacheSize enforcement
- Concurrent identical requests

### Interceptors
- Request interceptors
- Response transformers
- Error handlers
- Interceptor chaining
- Context passing
- Deterministic execution order
- Mutable context sharing

### Stats System
- Real-time metrics collection
- Query interface with grouping
- Performance analytics
- Rate calculations
- Error categorization
- Reset functionality
- Snapshot capabilities

### Error Handling
- Network error scenarios
- HTTP status code errors
- Timeout error handling
- Abort error scenarios
- Error recovery patterns
- Custom error processing

### Response Type Handling
- JSON response processing
- Text response handling
- Form data responses
- Binary data handling
- Content-Type detection
- Response parsing validation

### Timeout & Abort
- Timeout enforcement
- AbortController integration
- Request cancellation
- Cleanup behavior

### Custom Drivers
- Driver interface compliance
- Request/response mapping
- Error handling
- Signal propagation

### Framework Simulation
- useEffect patterns (React-like)
- State management patterns
- Error boundaries simulation
- Component lifecycle patterns
- Concurrent requests handling

## 🎯 Features

- **Programmatic Testing**: Validates actual behavior, not just API contracts
- **Framework Simulation**: Tests common patterns used across JavaScript frameworks
- **Mock Server**: Controlled HTTP responses for predictable testing
- **Timing Validation**: Ensures backoff strategies work as expected
- **Error Scenarios**: Tests failure cases and recovery
- **Performance Monitoring**: Measures request timing and resource usage
- **Real Package Import**: Tests the actual built package, not source files

## 📊 Test Output

Tests provide detailed output including:
- ✅ Pass/fail status with descriptive messages
- ⏱️ Timing measurements for backoff validation
- 📈 Performance metrics
- 🐛 Error details with stack traces
- 📋 Summary statistics

## 🔧 Configuration

Tests can be configured via environment variables:
- `TEST_TIMEOUT=10000` - Global test timeout (default: 10s)
- `MOCK_SERVER_PORT=4201` - Mock server port (default: 4201)
- `VERBOSE=true` - Enable verbose logging
- `SKIP_SLOW=true` - Skip long-running tests

## 🎭 Mock Server

The included mock server provides:
- Configurable delays for timeout testing
- Status code control for retry testing
- Request counting for backoff validation
- CORS headers for browser compatibility
- JSON/Text/Form response types

## 🔄 Continuous Testing

Ideal for:
- Pre-commit hooks
- CI/CD pipelines
- Development workflow
- Release validation
- Performance regression detection

## 🧩 Integration

Tests import directly from source (`../../src/index.js`), ensuring:
- Fast development iteration (no build step)
- Testing actual source code
- No package recursion issues
- Immediate feedback on changes

**Note**: Tests use source imports, not the built package. This means:
- ✅ No `luminara` dependency needed in `package.json`
- ✅ Changes to `src/` are immediately testable
- ✅ No risk of recursive folder structure (20GB+ issue)
- ⚠️ Tests validate source behavior, not the built bundle