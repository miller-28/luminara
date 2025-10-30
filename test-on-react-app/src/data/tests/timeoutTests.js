// timeoutTests.js - Timeout Handling Tests  
// Contains tests for request timeout behavior

import { createLuminara } from '../../services/luminaraService'

// Timeout Tests
export const timeoutTests = [
	{
		name: 'Timeout Test (3s)',
		call: (abortSignal, api) => {
			// Test Luminara's timeout option (now implemented with reliable AbortController)
			const timeoutApi = createLuminara({ 
				timeout: 3000, // This should cause timeout at 3 seconds via our AbortController implementation
				retry: 0, // Disable retries for timeout test
				retryDelay: 0 // Also disable retry delay
			})
			
			const options = abortSignal ? { signal: abortSignal } : {}
			
			// Use a URL that will definitely take longer than 3 seconds
			return timeoutApi.getJson('https://httpbingo.org/delay/10', options)
		},
		expected: 'Should timeout after 3 seconds via Luminara timeout option'
	}
]