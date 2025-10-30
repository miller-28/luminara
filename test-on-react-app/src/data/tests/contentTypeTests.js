// contentTypeTests.js - Content Type and Response Format Tests
// Contains tests for different content types and response formats

// Content Type Tests
export const contentTypeTests = [
	{
		name: 'GET Text Response',
		call: (abortSignal, api) => {
			const options = abortSignal ? { signal: abortSignal } : {}
			return api.getText('https://httpbingo.org/robots.txt', options)
		},
		expected: 'Should return plain text content'
	},
	{
		name: 'GET HTML Response',
		call: (abortSignal, api) => {
			const options = abortSignal ? { signal: abortSignal } : {}
			return api.getHtml('https://httpbingo.org/html', options)
		},
		expected: 'Should return HTML content'
	},
	{
		name: 'POST Form Data',
		call: (abortSignal, api) => {
			const options = abortSignal ? { signal: abortSignal } : {}
			return api.postForm('https://httpbingo.org/post', { name: 'John', email: 'john@example.com' }, options)
		},
		expected: 'Should submit form data'
	}
]