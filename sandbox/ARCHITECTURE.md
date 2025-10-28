# Sandbox Architecture Refactoring

This document explains the refactored sandbox architecture implementing separation of concerns.

## Before (Monolithic)

Previously, `sandbox/main.js` was a monolithic ~750-line file mixing:
- UI rendering code
- Test execution logic
- Test definitions
- State management
- Error handling

This made the code hard to maintain, test, and understand.

## After (Separated)

The sandbox is now split into three clean layers:

### 0. Presentation Layer - `styles.css` (260 lines)

**Purpose**: Visual styling ONLY

**Responsibilities**:
- All CSS styling rules
- Responsive design breakpoints
- Color schemes and typography
- Layout and spacing
- No inline styles in HTML

### 1. UI Layer - `main.js` (220 lines)

**Purpose**: DOM manipulation and visual presentation ONLY

**Responsibilities**:
- Render example cards
- Create buttons and outputs
- Handle button clicks (delegates to controller)
- Update visual state (colors, text, visibility)

**What it does NOT do**:
- Execute tests
- Manage AbortControllers
- Track test state
- Handle errors (beyond UI display)

**Key Methods**:
- `renderExamples()` - Create DOM structure
- `createExampleCard()` - Build example UI cards
- `handleRunTest()` - Delegate to controller, update UI
- `handleStopTest()` - Delegate to controller
- `handleClearAll()` - Reset UI state

### 2. Logic Layer - `testController.js` (104 lines)

**Purpose**: Test execution orchestration and state management

**Responsibilities**:
- Execute tests with AbortController support
- Manage test state (running, stopped, success, error)
- Coordinate between UI callbacks and test execution
- Handle errors and return structured results

**What it does NOT do**:
- Manipulate DOM
- Create UI elements
- Define tests

**Key Methods**:
- `runTest(testId, updateOutput, onStatusChange)` - Execute single test
- `stopTest(testId)` - Abort running test
- `runFeature(featureKey, runTestCallback)` - Run all tests in feature
- `runAll(runTestCallback)` - Run all tests sequentially
- `stopAll()` - Abort all running tests
- `findTest(testId)` - Lookup test by ID

**Return Format**:
```javascript
{
	status: 'success' | 'error' | 'stopped',
	message: string,
	stack?: string  // Only for errors
}
```

### 3. Data Layer - `examples/*.js` (8 files, ~400 lines total)

**Purpose**: Test definitions and configurations

**Structure**:
```javascript
export default {
	title: "Feature Name",
	tests: [
		{
			id: "test-id",
			title: "Test Name",
			run: async (updateOutput, signal) => {
				// Test implementation
				return "success message";
			}
		}
	]
};
```

**Files**:
1. `index.html` - HTML structure only (51 lines)
2. `styles.css` - All CSS styling (260 lines)
3. `basicUsage.js` - GET/POST JSON/Text/Form (4 tests)
4. `baseUrlAndQuery.js` - Base URL and query params (2 tests)
5. `timeout.js` - Timeout scenarios with live updates (2 tests)
6. `retry.js` - Basic retry logic with live logging (2 tests)
7. `backoffStrategies.js` - All 6 backoff strategies with live logging (6 tests)
8. `customRetry.js` - Custom retryDelay function (1 test)
9. `plugins.js` - Plugin system hooks (3 tests)
10. `customDriver.js` - Custom driver implementation (1 test)

**What these files do NOT contain**:
- UI code
- Execution logic
- State management

## Benefits of Separation

### 1. Maintainability
- Each file has a single, clear responsibility
- Changes to UI don't affect logic
- Changes to logic don't affect data
- Easy to find where to make changes

### 2. Readability
- `main.js`: 220 lines vs 750 lines
- Each file is focused and understandable
- No mixed concerns to parse mentally

### 3. Testability
- Logic layer can be tested without UI
- UI can be tested with mock controller
- Data layer is pure data

### 4. Scalability
- New tests: Add to appropriate example file
- New features: Add example file + update controller
- UI changes: Only modify main.js

### 5. AI-Friendly
- Clear file structure for AI agents
- Easy to navigate and understand
- Documented separation principles

## How Data Flows

```
User Clicks "Run" Button
        ↓
main.js handleRunTest()
        ↓
testController.runTest(testId, updateOutput, onStatusChange)
        ↓
testController finds test in examples
        ↓
testController creates AbortController
        ↓
testController.onStatusChange('running')
        ↓
main.js updates UI (buttons, colors)
        ↓
testController executes test.run(updateOutput, signal)
        ↓
test accesses API and calls updateOutput() for live updates
        ↓
main.js updates output <pre> element in real-time
        ↓
testController handles success/error/abort
        ↓
testController returns { status, message, stack? }
        ↓
main.js displays final result
        ↓
main.js resets button states
```

## File Size Comparison

| File | Before | After | Change |
|------|--------|-------|--------|
| index.html | 286 lines | 51 lines | -82.2% |
| styles.css | N/A | 260 lines | NEW |
| main.js | 750 lines | 220 lines | -70.7% |
| testController.js | N/A | 104 lines | NEW |
| examples/ (8 files) | N/A | ~400 lines | NEW |
| **Total** | 1036 lines | 1035 lines | -0.1% |

**Result**: Same total lines, but MUCH better organization with clear separation of concerns.

## Callback Pattern

The separation uses a callback pattern for UI updates:

```javascript
// UI provides callbacks to controller
const updateOutput = (content) => {
	outputElement.textContent = content;
};

const onStatusChange = (status) => {
	// Update button visibility, colors, etc.
};

// Controller uses callbacks to trigger UI updates
await testController.runTest(testId, updateOutput, onStatusChange);
```

This keeps the controller independent of UI implementation while allowing real-time updates.

## Stop Button Implementation

The stop functionality demonstrates clean separation:

1. **UI Layer**: 
   - Shows/hides stop button
   - Calls `testController.stopTest(testId)`

2. **Logic Layer**:
   - Manages `AbortController` for each test
   - Calls `controller.abort()` when stopped

3. **Data Layer**:
   - Test functions receive `signal` parameter
   - Pass signal to all HTTP requests

This allows any test to be aborted cleanly without coupling UI to abort logic.

## Key Takeaways

1. **UI code never executes tests** - it only delegates and displays
2. **Controller never touches DOM** - it only manages execution
3. **Examples never orchestrate** - they only define tests
4. **Each layer is independently testable and modifiable**

This architecture serves as a reference implementation for separation of concerns in this codebase.
