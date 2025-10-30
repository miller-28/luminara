// backoffTests.js - Backoff Strategy Tests
// Contains tests for different backoff strategies (exponential, fibonacci)

import { createLuminara } from '../../services/luminaraService'

// Backoff Strategy Tests (create separate client instances)
export const backoffTests = [
	{
		name: 'Exponential Backoff Test',
		call: async (abortSignal, api) => {
			const exponentialApi = createLuminara({
				retry: 2,
				retryDelay: 500,
				backoffType: 'exponential',
				retryStatusCodes: [503]
			})
			const options = abortSignal ? { signal: abortSignal } : {}
			return await exponentialApi.getJson('https://httpbingo.org/status/503', options)
		},
		expected: 'Should use exponential backoff (500ms, 1000ms delays)'
	},
	{
		name: 'Fibonacci Backoff Test',
		call: async (abortSignal, api) => {
			const fibApi = createLuminara({
				retry: 3, // Increase retries to see the Fibonacci sequence better
				retryDelay: 500, // Increase base delay to make it more visible
				backoffType: 'fibonacci',
				retryStatusCodes: [503]
			})
			const options = abortSignal ? { signal: abortSignal } : {}
			return await fibApi.getJson('https://httpbingo.org/status/503', options)
		},
		expected: 'Should use fibonacci backoff (1st: 500ms, 2nd: 500ms, 3rd: 1000ms delays) - total ~2s'
	}
]