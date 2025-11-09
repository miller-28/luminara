# Node.js LTS Support - Design Document

**Status**: 🟡 Awaiting Approval  
**Version**: 1.0  
**Date**: November 9, 2025  
**Target**: Luminara v0.10.0

---

## 📋 Executive Summary

Expand Luminara from a **browser-only** HTTP client to a **universal** client supporting both browsers and Node.js LTS versions (18.x, 20.x, 22.x).

**Current State**: Browser-only (Chrome, Firefox, Safari, Edge)  
**Target State**: Universal (Browsers + Node.js 18.x/20.x/22.x)

---

## 🎯 Objectives

### Primary Goals
1. ✅ Support Node.js LTS versions: **18.x, 20.x, 22.x**
2. ✅ Maintain **100% backward compatibility** with browser usage
3. ✅ Keep **zero external dependencies** principle
4. ✅ Use native `fetch()` API available in Node.js 18+
5. ✅ Maintain same API surface for both environments

### Non-Goals
- ❌ Support Node.js < 18 (no native fetch)
- ❌ Add Axios, node-fetch, or other HTTP library dependencies
- ❌ Create separate Node.js-specific API

---

## 🔍 Current Architecture Analysis

### What's Already Working
- ✅ **NativeFetchDriver** uses native `fetch()` API
- ✅ **Pure JavaScript** (no browser-specific APIs except fetch)
- ✅ **ESM + CJS** dual exports already configured
- ✅ **Zero dependencies** architecture
- ✅ Handler-based architecture (RequestDispatcher, InFlightHandler, etc.)

### Browser-Specific Dependencies
```javascript
// Current usage of native fetch in InFlightHandler.js:
const response = await fetch(fullUrl, fetchOptions);
```

**Analysis**: 
- ✅ Node.js 18+ has native `fetch()` globally available
- ✅ `AbortController` available in Node.js 15+
- ✅ `FormData` available in Node.js 18+
- ✅ No `window` or `document` objects used anywhere in core

---

## 📦 Node.js Native Fetch Compatibility

### Node.js Version Support Matrix

| Node.js Version | Fetch API | AbortController | Status |
|-----------------|-----------|-----------------|--------|
| **18.x (LTS)** | ✅ Native | ✅ Native | ✅ Target |
| **20.x (LTS)** | ✅ Native | ✅ Native | ✅ Target |
| **22.x (Current LTS)** | ✅ Native | ✅ Native | ✅ Target |
| 16.x | ❌ Experimental | ✅ Native | ❌ Not supported |
| < 16.x | ❌ None | ❌ None | ❌ Not supported |

**Decision**: Minimum Node.js version = **18.0.0** (first LTS with stable fetch)

### Node.js Fetch API Features

```javascript
// Node.js 18+ provides:
- global.fetch()           // ✅ Same as browser
- Request                  // ✅ Same as browser
- Response                 // ✅ Same as browser
- Headers                  // ✅ Same as browser
- AbortController          // ✅ Same as browser
- AbortSignal              // ✅ Same as browser
- FormData                 // ✅ Same as browser
- Blob                     // ✅ Same as browser
```

### Important Note: `--experimental-fetch` Flag

**Current State of test-cli**:
The `test-cli/package.json` currently uses `--experimental-fetch` flag for all test scripts:

```json
"test": "node --experimental-fetch testRunner.js"
"test:backoff": "node --experimental-fetch tests/backoff.test.js"
```

**Why This Flag is Obsolete**:
- The `--experimental-fetch` flag was only needed for Node.js **17.5.0 - 17.9.0**
- Node.js **18.0.0+** has **stable, built-in fetch** (not experimental)
- Using this flag is **misleading** - it suggests fetch is still experimental
- The flag has **no effect** in Node.js 18+ (fetch is enabled by default)

**Action Required**:
Remove `--experimental-fetch` from all test scripts. Tests should run with:
```bash
node testRunner.js              # Instead of: node --experimental-fetch testRunner.js
node tests/backoff.test.js      # Instead of: node --experimental-fetch tests/backoff.test.js
```

This change will be implemented in **Phase 2** of the implementation strategy.

---

## 🛠️ Implementation Strategy

### Phase 1: Core Compatibility (Zero Code Changes) ✅

**Hypothesis**: Luminara should work in Node.js 18+ without ANY code changes.

**Rationale**:
- Native fetch API is globally available
- No browser-specific APIs used (no `window`, `document`, `localStorage`, etc.)
- All dependencies are standard JavaScript features

**Action Items**:
1. ✅ Update `package.json` to declare Node.js support
2. ✅ Add `engines` field: `"node": ">=18.0.0"`
3. ✅ Update keywords to include `nodejs`, `node`, `server-side`
4. ✅ Test existing codebase in Node.js 18/20/22 environments

### Phase 2: Remove `--experimental-fetch` Flag

**Current Issue**:
The `test-cli/package.json` uses `--experimental-fetch` flag for all test scripts:

```json
"scripts": {
  "test": "node --experimental-fetch testRunner.js",
  "test:basic": "node --experimental-fetch tests/basic.test.js",
  "test:backoff": "node --experimental-fetch tests/backoff.test.js",
  // ... all other test scripts
}
```

**Why This is Unnecessary**:
- Node.js 18.0.0+ has **stable native fetch** (not experimental)
- The `--experimental-fetch` flag is only needed for Node.js 17.5.0 - 17.9.0
- Using this flag is misleading and suggests fetch is still experimental

**Action Required**:
Remove `--experimental-fetch` from ALL test scripts in `test-cli/package.json`:

```json
"scripts": {
  "test": "node testRunner.js",
  "test:basic": "node tests/basic.test.js",
  "test:backoff": "node tests/backoff.test.js",
  "test:debouncer": "node tests/debouncer.test.js",
  "test:interceptors": "node tests/interceptors.test.js",
  "test:timeout": "node tests/timeout.test.js",
  "test:drivers": "node tests/drivers.test.js",
  "test:react-simulation": "node tests/reactSimulation.test.js",
  "test:errors": "node tests/errors.test.js",
  "test:parse-response": "node tests/parseResponse.test.js",
  "test:response-types": "node tests/responseTypes.test.js",
  "test:stats": "node tests/stats.test.js",
  "test:rate-limit": "node tests/rateLimit.test.js",
  "test:edge-cases": "node tests/edgeCases.test.js",
  "test:deduplicator": "node tests/deduplicator.test.js",
  "test:watch": "nodemon testRunner.js"
}
```

**Verification**:
```powershell
# Should work without any flags
cd test-cli
node testRunner.js
node tests/backoff.test.js
```

### Phase 3: Testing & Validation

**Test Strategy**:
```powershell
# Test in Node.js 22 (current development environment)
node -v  # v22.14.0
cd test-cli
npm test

# Test in Node.js 18 (minimum supported)
# Use nvm-windows or Docker to test

# Test in Node.js 20 (active LTS)
# Use nvm-windows or Docker to test
```

**Test Coverage**:
- ✅ All existing CLI tests should pass in Node.js
- ✅ HTTP verbs (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
- ✅ Retry logic and backoff strategies
- ✅ Timeout handling with AbortController
- ✅ Stats system and query interface
- ✅ Rate limiting
- ✅ Debouncer and Deduplicator
- ✅ Plugin system and interceptors
- ✅ Response types (JSON, text, blob, arrayBuffer, etc.)
- ✅ Error handling

### Phase 4: Documentation Updates

**Files to Update**:

1. **README.md** - Update environment support section
2. **package.json** - Add Node.js keywords and engines field
3. **test-cli/package.json** - Remove `--experimental-fetch` flag from all test scripts
4. **test-cli/README.md** - Document Node.js testing
5. **types/index.d.ts** - Verify type definitions work in Node.js

**Documentation Changes**:

```markdown
### Environment Support
- ✅ **Browsers**: Chrome 88+, Firefox 90+, Safari 14+, Edge 88+
- ✅ **Node.js**: 18.x, 20.x, 22.x (LTS versions with native fetch)
- ✅ **Runtimes**: Deno, Bun (any runtime with native fetch API)
```

### Phase 5: CI/CD Integration (Optional)

**GitHub Actions Matrix** (if CI/CD exists):
```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x, 22.x]
    os: [ubuntu-latest, windows-latest, macos-latest]
```

---

## 📝 Required Changes

### 1. Main package.json Updates (Root)

```json
{
  "name": "luminara",
  "version": "0.10.0",
  "description": "Lightweight, universal HTTP client with native fetch for browsers and Node.js. Zero dependencies, comprehensive stats, retry strategies, backoff algorithms, and enhanced interceptors.",
  "engines": {
    "node": ">=18.0.0"
  },
  "keywords": [
    "fetch",
    "native-fetch",
    "http",
    "http-client",
    "ajax",
    "client",
    "browser",
    "nodejs",
    "node",
    "server-side",
    "universal",
    "isomorphic",
    "framework-agnostic",
    "react",
    "vue",
    "angular",
    "svelte",
    "vanilla-js",
    "pure-javascript",
    "zero-dependencies",
    "no-dependencies",
    "interceptors",
    "enhanced-interceptors",
    "retry",
    "backoff",
    "timeout",
    "stats",
    "metrics",
    "typescript",
    "esm",
    "commonjs",
    "dual-exports"
  ]
}
```

### 2. test-cli/package.json Updates

**Remove `--experimental-fetch` flag from ALL test scripts**:

```json
{
  "name": "@luminara/test-env",
  "version": "1.0.0",
  "description": "Testing environment for Luminara HTTP client - simulates real React application usage",
  "type": "module",
  "private": true,
  "scripts": {
    "test": "node testRunner.js",
    "test:basic": "node tests/basic.test.js",
    "test:retry": "node tests/retry.test.js",
    "test:backoff": "node tests/backoff.test.js",
    "test:debouncer": "node tests/debouncer.test.js",
    "test:interceptors": "node tests/interceptors.test.js",
    "test:timeout": "node tests/timeout.test.js",
    "test:drivers": "node tests/drivers.test.js",
    "test:react-simulation": "node tests/reactSimulation.test.js",
    "test:errors": "node tests/errors.test.js",
    "test:parse-response": "node tests/parseResponse.test.js",
    "test:response-types": "node tests/responseTypes.test.js",
    "test:stats": "node tests/stats.test.js",
    "test:rate-limit": "node tests/rateLimit.test.js",
    "test:edge-cases": "node tests/edgeCases.test.js",
    "test:deduplicator": "node tests/deduplicator.test.js",
    "test:watch": "nodemon testRunner.js"
  },
  "dependencies": {
    "luminara": "file:../",
    "chalk": "^5.3.0",
    "node-fetch": "^3.3.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

**Benefits of Removing `--experimental-fetch`**:
- ✅ Tests run with stable native fetch (not experimental)
- ✅ Cleaner npm scripts - no misleading flags
- ✅ Works correctly: `node tests/backoff.test.js` instead of `node --experimental-fetch tests/backoff.test.js`
- ✅ Aligns with Node.js 18+ where fetch is stable and built-in

### 3. README.md Updates

**Before**:
```markdown
### Runtime Requirements
- **Browser Environment Only** - Not for server-side/Node.js use
- Modern `fetch` API support
- ES2020+ JavaScript features
```

**After**:
```markdown
### Runtime Requirements
- **Universal**: Browsers (Chrome 88+, Firefox 90+, Safari 14+, Edge 88+)
- **Universal**: Node.js 18.x, 20.x, 22.x (LTS versions with native fetch)
- Modern `fetch` API support
- ES2020+ JavaScript features
```

### 3. Feature Highlights Update

**Add to README.md features section**:
```markdown
- 🌍 **Universal Compatibility** - Browser + Node.js 18+ (native fetch)
- 🔄 **Same API Everywhere** - Identical behavior in all environments
- 🚀 **Zero Dependencies** - Pure JavaScript, no polyfills needed
```

### 4. Installation Section Update

**Add Node.js example**:
```markdown
**Node.js (ESM)**
```javascript
import { createLuminara } from 'luminara';

const api = createLuminara({
  baseURL: 'https://api.example.com',
  retry: 3,
  timeout: 5000
});

const data = await api.getJson('/users');
console.log(data);
```

**Node.js (CommonJS)**
```javascript
const { createLuminara } = require('luminara');

const api = createLuminara({
  baseURL: 'https://api.example.com'
});

api.getJson('/users')
  .then(data => console.log(data))
  .catch(err => console.error(err));
```
```

---

## 🧪 Testing Strategy

### Test Environments

1. **Node.js 22.x** (Current Development)
   - Run full test suite: `npm test`
   - All 17 test files should pass

2. **Node.js 20.x** (Active LTS)
   - Install via nvm-windows: `nvm install 20; nvm use 20`
   - Run full test suite: `npm test`

3. **Node.js 18.x** (Maintenance LTS)
   - Install via nvm-windows: `nvm install 18; nvm use 18`
   - Run full test suite: `npm test`

### Test Validation Checklist

```powershell
# For each Node.js version:
cd test-cli

# Run all tests
npm test

# Expected output: ✅ All tests pass
# - Basic HTTP operations
# - Retry logic and backoff
# - Timeout handling
# - Stats system
# - Rate limiting
# - Debouncer
# - Deduplicator
# - Plugin system
# - Error handling
# - Response types
```

---

## 🚨 Risk Analysis

### Low Risk Items ✅
- ✅ Native fetch API identical between browser and Node.js 18+
- ✅ No browser-specific APIs used in codebase
- ✅ Pure JavaScript implementation
- ✅ Existing test suite runs in Node.js (test-cli)

### Medium Risk Items ⚠️
- ⚠️ **FormData behavior differences**: Node.js FormData might behave slightly differently
- ⚠️ **CORS**: Not applicable in Node.js (server-to-server), but shouldn't break anything
- ⚠️ **Headers casing**: Node.js might handle header casing differently

### Mitigation Strategy
1. Run comprehensive test suite in all Node.js versions
2. Add Node.js-specific integration tests if needed
3. Document any environment-specific quirks in README

---

## 📊 Success Criteria

### Must Have ✅
- ✅ All existing tests pass in Node.js 18.x, 20.x, 22.x **without `--experimental-fetch` flag**
- ✅ `package.json` declares Node.js support (`engines` field)
- ✅ `test-cli/package.json` removes `--experimental-fetch` from all scripts
- ✅ Tests run with: `node tests/backoff.test.js` (no flags needed)
- ✅ README.md updated with Node.js examples
- ✅ No breaking changes to browser usage
- ✅ Zero new dependencies added

### Nice to Have 🎯
- 🎯 Node.js-specific examples in sandbox (optional)
- 🎯 CI/CD matrix testing across Node.js versions
- 🎯 Performance benchmarks (Node.js vs browser)

---

## 📅 Implementation Timeline

### Immediate (1-2 hours)
1. ✅ Update main `package.json` (engines, keywords, description)
2. ✅ Update `test-cli/package.json` (remove `--experimental-fetch` from all scripts)
3. ✅ Test in current Node.js 22.x environment without flags
4. ✅ Update README.md documentation

### Short-term (2-4 hours)
1. ⏳ Test in Node.js 20.x (Active LTS) without flags
2. ⏳ Test in Node.js 18.x (Maintenance LTS) without flags
3. ⏳ Fix any compatibility issues discovered
4. ⏳ Update all README files

### Long-term (Optional)
1. 🎯 Add CI/CD matrix testing
2. 🎯 Create Node.js-specific examples
3. 🎯 Performance optimization for Node.js

---

## 🔄 Rollback Plan

**If Node.js support introduces issues**:
1. Revert `package.json` changes (remove `engines` field)
2. Revert README.md changes
3. Document incompatibilities in GitHub Issues
4. Release v0.9.2 with reverted changes

**Risk Level**: **LOW** - No code changes required, only metadata updates

---

## 📖 References

- [Node.js Fetch API Documentation](https://nodejs.org/dist/latest-v18.x/docs/api/globals.html#fetch)
- [Node.js 18 Release Notes](https://nodejs.org/en/blog/announcements/v18-release-announce)
- [Node.js LTS Schedule](https://github.com/nodejs/release#release-schedule)

---

## ✅ Approval Checklist

**Please review and approve the following**:

- [ ] **Minimum Node.js version**: 18.0.0 (first LTS with stable fetch)
- [ ] **Remove `--experimental-fetch` flag**: Update `test-cli/package.json` to remove flag from ALL test scripts
- [ ] **Testing strategy**: Run existing test suite in Node.js 18/20/22 without flags
- [ ] **Zero code changes**: Only metadata and documentation updates
- [ ] **Backward compatibility**: No breaking changes to browser usage
- [ ] **Main package.json updates**: Add `engines` field and Node.js keywords
- [ ] **Test package.json updates**: Remove `--experimental-fetch` from all npm scripts
- [ ] **README.md updates**: Add Node.js examples and environment support
- [ ] **Version bump**: 0.9.1 → 0.10.0 (minor version for new feature)

---

## 🎉 Expected Outcome

After implementation, Luminara will:
- ✅ Work identically in browsers and Node.js 18+
- ✅ Maintain zero dependencies
- ✅ Support all existing features (retry, backoff, stats, rate limiting, etc.)
- ✅ Use native fetch API in all environments
- ✅ Be a truly universal HTTP client

**Marketing**: "Universal HTTP client with native fetch - works everywhere from browsers to Node.js servers, zero dependencies, one API."
