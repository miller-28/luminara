// queryHeaderTests.js - Query Parameters and Headers Tests
// Contains tests for URL query parameters and custom headers

import { createLuminara } from '../../services/luminaraService'

// Query Parameters & Headers Tests
export const queryHeaderTests = [
	{
		name: 'GET with Query Params',
		call: (abortSignal, api) => {
			const options = abortSignal ? { 
				signal: abortSignal,
				query: { search: 'luminara', page: 1, limit: 10 } 
			} : { 
				query: { search: 'luminara', page: 1, limit: 10 } 
			}
			return api.get('https://httpbingo.org/get', options)
		},
		expected: 'Should include query parameters in URL'
	},
	{
		name: 'Custom Headers',
		call: (abortSignal, api) => {
			const options = abortSignal ? {
				signal: abortSignal,
				headers: { 
					'X-Custom-Header': 'Luminara-Test',
					'X-API-Key': 'test-key-123'
				}
			} : {
				headers: { 
					'X-Custom-Header': 'Luminara-Test',
					'X-API-Key': 'test-key-123'
				}
			}
			return api.get('https://httpbingo.org/headers', options)
		},
		expected: 'Should send custom headers'
	},
	{
		name: 'Base URL Test',
		call: (abortSignal, api) => {
			const baseApi = createLuminara({ baseURL: 'https://httpbingo.org' })
			const options = abortSignal ? { signal: abortSignal } : {}
			return baseApi.getJson('/json', options)
		},
		expected: 'Should use base URL for relative paths'
	}
]