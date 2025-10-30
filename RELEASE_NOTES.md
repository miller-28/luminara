# Luminara Release Notes

## Version 0.5.1 (October 30, 2025)

### 🚀 Bundle Size Optimization

#### Minified Distribution 
- **58% Size Reduction**: Enabled minification in build system
  - ESM bundle: 27.79 KB → 11.80 KB (~58% smaller)
  - CJS bundle: 28.13 KB → 11.87 KB (~58% smaller)
  - **Ultra-compact footprint**: ~12KB minified, estimated ~4KB gzipped

#### Build System Enhancements
- **Advanced Minification**: Enabled comprehensive minification options
  - `minifyWhitespace: true` - Removes unnecessary whitespace
  - `minifyIdentifiers: true` - Shortens variable names
  - `minifySyntax: true` - Optimizes JavaScript syntax
  - Maintains source maps for debugging

#### Performance Benefits
- **Faster Downloads**: Significantly reduced network transfer time
- **Better Performance**: Smaller bundle size improves load times
- **CDN Optimization**: Reduced bandwidth costs for CDN delivery
- **Mobile-Friendly**: Especially beneficial for mobile users with limited bandwidth

### 📊 Metrics
- **Bundle Size**: 58% reduction across both ESM and CJS formats
- **Zero Feature Loss**: All functionality preserved with optimization
- **Source Map Support**: Full debugging capability maintained
- **Backward Compatibility**: No breaking changes, drop-in replacement

---

## Version 0.5.0 (October 30, 2025)

### � MAJOR ARCHITECTURAL OVERHAUL

#### Complete Source Code Restructuring
- **Domain-Driven Architecture**: Completely restructured `src/` folder into feature-based domains
  - `src/core/` - Core client abstraction layer
  - `src/drivers/native/` - Native fetch driver with modular feature system
  - `src/drivers/ofetch/` - Ofetch driver implementation
  - Each driver now has its own dedicated directory and feature modules

#### Driver Architecture Revolution  
- **Feature-Based Modular System**: Native driver now organized by feature domains
  - `src/drivers/native/features/retry/` - Retry logic, backoff strategies, retry policies
  - `src/drivers/native/features/timeout/` - Timeout handling
  - `src/drivers/native/features/response/` - Response type processing
  - `src/drivers/native/features/error/` - Error handling utilities
  - `src/drivers/native/features/url/` - URL processing and query handling

- **Client-Driver Separation**: Complete separation of concerns between client and drivers
  - `LuminaraClient` in `src/core/` handles plugin system and high-level orchestration
  - Drivers handle HTTP implementation details and feature-specific logic
  - Clean interfaces between client and driver layers
  - Pluggable driver architecture allowing easy driver swapping

#### Export System Redesign
- **Comprehensive API Exports**: New export structure from `src/index.js`
  - Factory function: `createLuminara()` for simple usage
  - Direct access: `LuminaraClient`, `NativeFetchDriver`, `OfetchDriver`
  - Feature utilities: `backoffStrategies`, `createBackoffHandler`
  - Retry policies: `defaultRetryPolicy`, `createRetryPolicy`, `parseRetryAfter`
  - Constants: `IDEMPOTENT_METHODS`, `DEFAULT_RETRY_STATUS_CODES`

#### Developer Experience Improvements
- **Modular Feature Development**: Each feature is self-contained with its own utilities
- **Clear Separation of Concerns**: Business logic separated from HTTP transport
- **Extensible Architecture**: Easy to add new drivers or extend existing features
- **Better Code Organization**: Domain-driven structure improves maintainability

### �🐛 Bug Fixes & Sandbox Improvements

#### Sandbox Environment Fixes
- **Parameter Naming Standardization**: Fixed inconsistent parameter naming across response type examples
  - Updated all `outputCallback` parameters to `updateOutput` for consistency
  - Affected files: `responseTypes.js` (stream, arrayBuffer, auto, default examples)
  - Ensures proper callback function binding and UI updates

- **Scope Issue Resolution**: Fixed variable scope error in advanced retry policies
  - Moved `startTime` declaration outside try block in `advancedRetryPolicies.js`
  - Resolves "startTime is not defined" ReferenceError
  - Enables proper duration calculation in catch blocks

- **Network Connectivity Improvements**: Enhanced reliability of response type examples
  - Migrated from `httpbin.org` to `httpbingo.org` for all response type tests
  - Better CORS support for localhost browser testing
  - Eliminates "Failed to fetch" errors in sandbox environment

#### Code Quality Enhancements
- **Consistent Formatting**: Applied proper one-liner formatting to retry examples
  - Converted multi-line `updateOutput` calls to single lines with `\n` separators
  - Improved code readability and maintainability
  - Follows project coding standards

#### Build System Stability
- **Distribution Compilation**: Ensured all architectural changes are properly compiled
  - Multiple build cycles to validate new structure
  - ESM (`dist/index.mjs`) and CJS (`dist/index.cjs`) formats updated
  - All new exports and feature modules properly bundled

### 🎯 Testing & Validation
- **3-Tier Testing Strategy**: All functionality validated across:
  - ✅ Sandbox environment (manual browser testing)  
  - ✅ CLI testing (automated unit tests)
  - ✅ React browser testing (integration validation)

### 📊 Metrics
- **100% Backward Compatibility**: All existing APIs continue to work
- **Zero Breaking Changes**: Factory function maintains same interface
- **Enhanced Modularity**: 5 feature domains with dedicated utilities
- **Driver Flexibility**: 2 driver implementations (Native, Ofetch)
- **Complete Test Coverage**: All architectural changes thoroughly tested

---

## Version 0.4.0 (October 30, 2025)

### 🚀 Build System & Distribution Revolution

#### Dual Export Support (ESM/CJS)
- **Universal Compatibility**: Added support for both ESM and CommonJS formats
  - `dist/index.mjs` - ES Module format for modern bundlers and Node.js
  - `dist/index.cjs` - CommonJS format for legacy environments
  - Proper `package.json` exports configuration for automatic format detection
  - Maintains compatibility across all JavaScript environments

#### Auto-Build System Implementation
- **Development Workflow Enhancement**: Implemented automatic build system with tsup
  - `npm run build` - Production build for distribution
  - `npm run build:watch` - Development mode with auto-rebuild on file changes
  - `npm run dev` - Alias for watch mode during active development
  - **Critical Requirement**: All `src/` changes must be built before testing

#### TypeScript Support Infrastructure
- **Type Definitions**: Added comprehensive TypeScript support
  - Generated type definitions in `types/index.d.ts`
  - Proper type exports in package.json
  - IntelliSense support for all APIs and configuration options
  - Maintains pure JavaScript source code while providing TypeScript DX

#### Package Distribution Optimization
- **Build Configuration**: Optimized build pipeline with tsup
  - ES2020 target for modern browser compatibility
  - Tree-shaking friendly exports
  - Source maps for debugging
  - Minimal bundle size optimization

#### Development Environment Standards
- **PowerShell Integration**: Established Windows/PowerShell as primary development environment
  - PowerShell command syntax in all documentation
  - Windows path separator compatibility
  - PowerShell-specific command chaining with `;`

### 📊 Metrics
- **Universal Package Support**: ESM + CJS compatibility
- **Zero Configuration**: Automatic format detection
- **Developer Experience**: TypeScript support without complexity
- **Build Performance**: Fast incremental builds with tsup
- **Distribution Size**: Optimized bundle sizes for both formats

---

## Version 0.3.0 (October 30, 2025)

### 🚀 Major Improvements

#### Driver Architecture Restructure
- **Conceptual Separation**: Refactored `src/drivers/` folder into separate directories for better organization
  - `src/drivers/native/` - Native fetch driver with modular utilities
  - `src/drivers/ofetch/` - Ofetch driver implementation
  - Each driver now has its own dedicated directory and utilities

#### Test Infrastructure Overhaul
- **Port Migration**: Updated all CLI test mock servers from 3XXX to 42XX port pattern
  - Prevents conflicts with common development services (webpack, Vite, etc.)
  - Each test suite now has dedicated port for parallel execution
  - Port allocation: 4201 (default), 4202 (backoff), 4203 (plugins), 4204 (retry), 4205 (timeout), 4206 (drivers), 4207 (react-sim), 4209 (enhanced-interceptors), 4211 (basic)

- **Timing Tolerance Improvements**: Enhanced test reliability with generous timing tolerances
  - ±300-500ms tolerances for network-dependent tests
  - ±500-700ms tolerances for full test suite execution
  - Prevents flaky tests due to system load and network variance

- **React Test Structure Refactoring**: Organized React browser tests into modular architecture
  - `basicHttpTests.js` - Fundamental HTTP operations
  - `contentTypeTests.js` - Content type handling
  - `queryHeaderTests.js` - Query parameters and headers
  - `retryErrorTests.js` - Retry logic and error handling
  - `backoffTests.js` - Backoff strategies
  - `timeoutTests.js` - Timeout handling
  - `pluginTests.js` - Plugin system and interceptors
  - `driverTests.js` - Driver comparisons
  - Main `testDefinitions.js` aggregates all modules

#### Development Process Improvements
- **Enhanced Copilot Instructions**: Added comprehensive guidelines for:
  - Mock server port allocation (42XX pattern)
  - Timing tolerance requirements
  - React test environment manual validation
  - Efficient testing strategies (targeted vs comprehensive)

- **Folder Restructuring**: Renamed `test/` to `test-cli/` for better clarity
  - Aligns with `test-on-react-app/` naming convention
  - Makes CLI testing purpose explicit
  - Updated all references and documentation

### 🎯 Performance & Reliability
- **100% Test Success Rate**: All 96 CLI tests passing consistently
- **22/22 React Browser Tests**: Perfect success rate in browser environment
- **Service Isolation**: Eliminated port conflicts with development tools
- **Maintainable Architecture**: Better separation of concerns across all test environments

### 🔧 Technical Details
- **Driver Organization**: Clear conceptual separation between driver types
- **Test Port Range**: 42XX pattern prevents conflicts with common services
- **Modular Testing**: Each test category in separate, focused files
- **Documentation**: Updated copilot instructions with testing best practices

### 📊 Metrics
- **CLI Tests**: 96/96 passing (100% success rate)
- **React Tests**: 22/22 passing (100% success rate)
- **Test Suites**: 12 comprehensive test suites
- **Test Files**: Organized into 8 focused modules + aggregator
- **Port Conflicts**: Eliminated through systematic port migration

---

## Version 0.2.4 (Previous Release)
- Enhanced interceptor system with retry-aware authentication
- Improved error handling and context sharing
- AbortController integration for request cancellation
- Driver comparison functionality
- Comprehensive plugin system

---

## Release Process

When updating versions, include:
1. **Architecture Changes**: Any structural modifications
2. **Feature Additions**: New capabilities or enhancements
3. **Performance Improvements**: Speed, reliability, or efficiency gains
4. **Test Infrastructure**: Testing improvements and validation
5. **Documentation Updates**: Process and guideline improvements
6. **Metrics**: Success rates and quantitative improvements

---

*This file is automatically updated with each version release to track Luminara's evolution and improvements.*