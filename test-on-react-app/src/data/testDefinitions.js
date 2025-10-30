// testDefinitions.js - Data Layer (PURE DATA - NO LOGIC OR UI)
// Contains all test configurations and definitions - aggregated from separate test modules

// Import all test modules
import { basicHttpTests } from './tests/basicHttpTests.js'
import { contentTypeTests } from './tests/contentTypeTests.js'
import { queryHeaderTests } from './tests/queryHeaderTests.js'
import { retryErrorTests } from './tests/retryErrorTests.js'
import { backoffTests } from './tests/backoffTests.js'
import { timeoutTests } from './tests/timeoutTests.js'
import { pluginTests } from './tests/pluginTests.js'
import { driverTests } from './tests/driverTests.js'

// Aggregate all test definitions from separate modules
export const testDefinitions = [
	...basicHttpTests,
	...contentTypeTests,
	...queryHeaderTests,
	...retryErrorTests,
	...backoffTests,
	...timeoutTests,
	...pluginTests,
	...driverTests
]

// Test configuration metadata
export const testConfiguration = {
	totalTests: testDefinitions.length,
	retries: 3,
	delay: '1500ms linear backoff (default)',
	retryStatusCodes: [408, 429, 500, 502, 503, 504],
	environment: 'Browser (React + Vite)',
	coverage: 'HTTP methods, content types, retries, backoff strategies, plugins, timeouts'
}