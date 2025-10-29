// testDefinitions.js - Data Layer (PURE DATA - NO LOGIC OR UI)
// Contains all test configurations and definitions

import { createLuminara } from '../services/luminaraService'
import { ofetch } from 'ofetch'

// Test definitions - pure data configuration
export const testDefinitions = [
	// Basic HTTP Methods
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
	},
	
	// Content Type Tests
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
	},
	
	// Query Parameters & Headers
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
	
	// Retry & Error Handling Tests
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
	},
	
	// Backoff Strategy Tests (create separate client instances)
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
	},
	
	// Timeout Tests
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
	},
	
	// Base URL Tests
	{
		name: 'Base URL Test',
		call: (abortSignal, api) => {
			const baseApi = createLuminara({ baseURL: 'https://httpbingo.org' })
			const options = abortSignal ? { signal: abortSignal } : {}
			return baseApi.getJson('/json', options)
		},
		expected: 'Should use base URL for relative paths'
	},
	
	// Plugin System Tests
	{
		name: 'Custom Plugin Test',
		call: async (abortSignal, api) => {
			const pluginApi = createLuminara()
			let pluginExecuted = false
			
			pluginApi.use({
				onRequest(req) {
					pluginExecuted = true
					req.headers = { ...req.headers, 'X-Plugin-Test': 'executed' }
					return req
				},
				onSuccess(res) {
					res.pluginData = { executed: pluginExecuted }
					return res
				}
			})
			
			const options = abortSignal ? { signal: abortSignal } : {}
			const result = await pluginApi.get('https://httpbingo.org/headers', options)
			if (!result.pluginData?.executed) {
				throw new Error('Plugin did not execute properly')
			}
			return result
		},
		expected: 'Should execute custom plugin hooks'
	},
	
	// Raw ofetch comparison
	{
		name: 'Raw ofetch 503 Test',
		call: async (abortSignal, api) => {
			console.log('🧪 Testing raw ofetch with retry config')
			const options = {
				retry: 3,
				retryDelay: 1500,
				retryStatusCodes: [408, 429, 500, 502, 503, 504]
			}
			if (abortSignal) {
				options.signal = abortSignal
			}
			return await ofetch('https://httpbingo.org/status/503', options)
		},
		expected: 'Raw ofetch test - should retry 3 times - Test PASSES if retries happen'
	}
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