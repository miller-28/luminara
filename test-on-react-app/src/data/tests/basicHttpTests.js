// basicHttpTests.js - Basic HTTP Methods Tests
// Contains fundamental HTTP operation tests (GET, POST, PUT, DELETE)

// Basic HTTP Methods Tests
export const basicHttpTests = [
	{
		name: 'GET Request (JSON)',
		call: (abortSignal, api) => {
			const options = abortSignal ? { signal: abortSignal } : {}
			return api.getJson('https://httpbingo.org/json', options)
		},
		expected: 'Should succeed immediately with JSON response'
	},
	{
		name: 'POST Request',
		call: (abortSignal, api) => {
			const options = abortSignal ? { signal: abortSignal } : {}
			return api.post('https://httpbingo.org/post', { test: 'data', timestamp: Date.now() }, options)
		},
		expected: 'Should POST JSON data successfully'
	},
	{
		name: 'PUT Request',
		call: (abortSignal, api) => {
			const options = abortSignal ? { signal: abortSignal } : {}
			return api.put('https://httpbingo.org/put', { updated: true, id: 123 }, options)
		},
		expected: 'Should PUT data successfully'
	},
	{
		name: 'DELETE Request',
		call: (abortSignal, api) => {
			const options = abortSignal ? { signal: abortSignal } : {}
			return api.del('https://httpbingo.org/delete', options)
		},
		expected: 'Should DELETE successfully'
	}
]