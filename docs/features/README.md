# Luminara Features Documentation

Comprehensive documentation for all Luminara HTTP client features.

## 📚 Table of Contents

### Core Features
- [Basic Usage](./basic-usage.md) - GET, POST, and fundamental HTTP operations
- [Base URL & Query Parameters](./base-url-query.md) - URL configuration and query string handling

### Request Lifecycle
- [Interceptors](./interceptors.md) - Enhanced interceptor architecture with deterministic order
- [Stats System](./stats.md) - Real-time metrics, analytics, and query interface
- [Verbose Logging](./verbose-logging.md) - Detailed debugging and request tracing

### Pre-Flight Features
- [Request Deduplication](./deduplication.md) - Automatic in-flight duplicate request prevention
- [Request Debouncing](./debouncing.md) - Intelligent request delay with automatic cancellation
- [Rate Limiting](./rate-limiting.md) - Token bucket algorithm with multi-level scoping

### In-Flight Features
- [Timeout](./timeout.md) - Configurable timeouts and abort controller support
- [Retry](./retry.md) - Comprehensive retry system with 6 backoff strategies
- [Backoff Strategies](./backoff-strategies.md) - Exponential, Fibonacci, Jitter, Linear, Polynomial, Custom
- [Request Hedging](./request-hedging.md) - Race and cancel-and-retry policies for latency optimization

### Post-Flight Features
- [Response Types](./response-types.md) - JSON, text, form data, blob, arrayBuffer, stream
- [Error Handling](./error-handling.md) - Comprehensive error categorization and handling

### Advanced
- [Custom Drivers](./custom-drivers.md) - Building custom HTTP backend adapters

## 🚀 Quick Links

- [Main README](../../README.md)
- [Performance Benchmarks](../performance.md)
- [UML Diagrams](../uml/README.md)
- [Sandbox Examples](../../sandbox/README.md)
- [CLI Testing](../../test-cli/README.md)

## 💡 Contributing

Found an issue or want to improve documentation? Please [open an issue](https://github.com/miller-28/luminara/issues) or submit a pull request!

## 📖 License

MIT © [Jonathan Miller](https://github.com/miller-28)
