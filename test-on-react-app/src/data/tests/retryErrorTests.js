// retryErrorTests.js - Retry Logic and Error Handling Tests
// Contains tests for retry behavior with different HTTP error status codes

import { createLuminara } from '../../services/luminaraService'

// Retry & Error Handling Tests
export const retryErrorTests = [
	{
		name: '503 Status with Retry',
		call: (abortSignal, api) => {
			const options = abortSignal ? { signal: abortSignal } : {}
			return api.getJson('https://httpbingo.org/status/503', options)
		},
		expected: 'Should retry 3 times with 1.5s delays - Test PASSES if retries happen'
	},
	{
		name: '500 Status with Retry',
		call: (abortSignal, api) => {
			const options = abortSignal ? { signal: abortSignal } : {}
			return api.getJson('https://httpbingo.org/status/500', options)
		},
		expected: 'Should retry 3 times with 1.5s delays - Test PASSES if retries happen'
	},
	{
		name: '429 Too Many Requests',
		call: (abortSignal, api) => {
			const retryApi = createLuminara({
				retry: 3,
				retryDelay: 1500,
				backoffType: 'linear',
				retryStatusCodes: [408, 429, 500, 502, 503, 504] // Ensure 429 is included
			})
			const options = abortSignal ? { signal: abortSignal } : {}
			return retryApi.getJson('https://httpbingo.org/status/429', options)
		},
		expected: 'Should retry for rate limit status - Test PASSES if retries happen'
	}
]