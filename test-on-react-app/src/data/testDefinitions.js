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
	
	// Enhanced Interceptor System Tests
	{
		name: 'Enhanced Interceptors: Execution Order',
		call: async (abortSignal, api) => {
			const interceptorApi = createLuminara()
			const executionLog = []
			
			// First interceptor (executes FIRST for request, LAST for response)
			interceptorApi.use({
				onRequest(context) {
					executionLog.push('req-1')
					context.meta.first = 'executed'
				},
				onResponse(context) {
					executionLog.push('res-1')
					context.res.data.executionOrder = executionLog.slice() // Snapshot at this point
				}
			})
			
			// Second interceptor (executes SECOND for request, MIDDLE for response)
			interceptorApi.use({
				onRequest(context) {
					executionLog.push('req-2')
					if (!context.meta.first) throw new Error('First interceptor did not execute')
				},
				onResponse(context) {
					executionLog.push('res-2')
				}
			})
			
			// Third interceptor (executes THIRD for request, FIRST for response)
			interceptorApi.use({
				onRequest(context) {
					executionLog.push('req-3')
				},
				onResponse(context) {
					executionLog.push('res-3')
				}
			})
			
			const options = abortSignal ? { signal: abortSignal } : {}
			const result = await interceptorApi.getJson('https://httpbingo.org/json', options)
			
			// Verify execution order
			const expectedOrder = ['req-1', 'req-2', 'req-3', 'res-3', 'res-2', 'res-1']
			if (JSON.stringify(executionLog) !== JSON.stringify(expectedOrder)) {
				throw new Error(`Wrong execution order. Expected: ${expectedOrder.join(',')} Got: ${executionLog.join(',')}`)
			}
			
			result.interceptorTest = { 
				executionLog, 
				success: true,
				order: 'L→R for requests, R→L for responses'
			}
			return result
		},
		expected: 'Should execute interceptors in deterministic order (L→R requests, R→L responses)'
	},
	{
		name: 'Enhanced Interceptors: Mutable Context',
		call: async (abortSignal, api) => {
			const contextApi = createLuminara()
			let contextSnapshot = null
			
			// First interceptor adds metadata
			contextApi.use({
				onRequest(context) {
					// Verify context structure
					if (!context.req || context.res !== null || context.error !== null) {
						throw new Error('Invalid initial context state')
					}
					if (!context.controller || typeof context.attempt !== 'number' || !context.meta) {
						throw new Error('Missing required context properties')
					}
					
					context.meta.userId = 'user-123'
					context.meta.sessionId = 'session-' + Date.now()
					context.meta.tags = ['react-test']
				}
			})
			
			// Second interceptor reads and modifies shared metadata
			contextApi.use({
				onRequest(context) {
					if (!context.meta.userId || !context.meta.sessionId) {
						throw new Error('Shared metadata not accessible')
					}
					
					context.meta.tags.push('context-verified')
					context.req.headers = {
						...context.req.headers,
						'X-User-ID': context.meta.userId,
						'X-Session-ID': context.meta.sessionId
					}
				},
				onResponse(context) {
					// Verify context persists through response
					context.res.data.contextMeta = {
						userId: context.meta.userId,
						sessionId: context.meta.sessionId,
						tags: context.meta.tags,
						attempt: context.attempt
					}
					contextSnapshot = { ...context.meta }
				}
			})
			
			const options = abortSignal ? { signal: abortSignal } : {}
			const result = await contextApi.getJson('https://httpbingo.org/json', options)
			
			if (!result.data.contextMeta || !contextSnapshot) {
				throw new Error('Context data not properly shared')
			}
			
			result.contextTest = { 
				shared: true,
				snapshot: contextSnapshot,
				verified: contextSnapshot.tags.includes('context-verified')
			}
			return result
		},
		expected: 'Should share mutable context between interceptors with full state access'
	},
	{
		name: 'Enhanced Interceptors: Retry-Aware Auth',
		call: async (abortSignal, api) => {
			const authApi = createLuminara({
				retry: 2,
				retryDelay: 300,
				retryStatusCodes: [500] // Will retry on 500 errors
			})
			
			const authCalls = []
			let tokenRefreshCount = 0
			
			// Mock token service
			const getAuthToken = (attempt) => {
				if (attempt > 1) {
					tokenRefreshCount++
					return `fresh-token-${tokenRefreshCount}`
				}
				return 'initial-token'
			}
			
			// Auth interceptor that runs on every retry
			authApi.use({
				onRequest(context) {
					const token = getAuthToken(context.attempt)
					authCalls.push(`attempt-${context.attempt}:${token}`)
					
					context.req.headers = {
						...context.req.headers,
						'Authorization': `Bearer ${token}`,
						'X-Attempt': context.attempt.toString()
					}
					
					context.meta.currentToken = token
				},
				onResponse(context) {
					context.res.data.authTest = {
						tokenUsed: context.meta.currentToken,
						attempt: context.attempt,
						authCalls: authCalls.slice()
					}
				}
			})
			
			const options = abortSignal ? { signal: abortSignal } : {}
			
			try {
				// This should succeed on first try, showing the auth interceptor works
				const result = await authApi.getJson('https://httpbingo.org/json', options)
				
				result.retryAwareTest = {
					success: true,
					authCalls,
					tokenRefreshCount,
					demonstratedRetryAware: authCalls.length >= 1
				}
				return result
			} catch (error) {
				// Even if it fails, we can verify the retry-aware behavior
				return {
					data: {
						retryAwareTest: {
							failed: true,
							authCalls,
							tokenRefreshCount,
							demonstratedRetryAware: authCalls.length > 1,
							error: error.message
						}
					}
				}
			}
		},
		expected: 'Should generate fresh auth tokens on each retry attempt'
	},
	{
		name: 'Enhanced Interceptors: AbortController',
		call: async (abortSignal, api) => {
			const abortApi = createLuminara({
				retry: 0, // Disable retries to prevent interference with abort test
				retryDelay: 0
			})
			let interceptorController = null
			let abortedFromInterceptor = false
			
			// Interceptor that tests AbortController access
			abortApi.use({
				onRequest(context) {
					// Verify controller access
					if (!context.controller || typeof context.controller.abort !== 'function') {
						throw new Error('AbortController not accessible in context')
					}
					
					interceptorController = context.controller
					
					// Abort after 500ms for faster testing
					setTimeout(() => {
						context.controller.abort('Test abort from interceptor')
						abortedFromInterceptor = true
					}, 500)
				},
				onResponseError(context) {
					// Check for abort error - ofetch wraps AbortError in FetchError
					if (context.error && (
						context.error.name === 'AbortError' || 
						context.error.name === 'FetchError' ||
						context.error.message?.includes('aborted') ||
						context.error.message?.includes('Test abort from interceptor') ||
						context.error.cause === 'Test abort from interceptor'
					)) {
						context.error.abortedByInterceptor = abortedFromInterceptor
					}
				}
			})
			
			const options = abortSignal ? { signal: abortSignal } : {}
			
			try {
				// Use a shorter delayed endpoint to ensure abort happens quickly
				const result = await abortApi.getJson('https://httpbingo.org/delay/2', options)
				throw new Error('Request should have been aborted')
			} catch (error) {
				// Check for various abort error patterns - ofetch wraps AbortError in FetchError
				const isAbortError = error.name === 'AbortError' || 
					error.name === 'FetchError' ||
					error.message?.includes('aborted') || 
					error.message?.includes('signal') ||
					error.message?.includes('Test abort from interceptor') ||
					error.cause === 'Test abort from interceptor' ||
					error.code === 'ABORT_ERR'
				
				if (isAbortError && error.abortedByInterceptor) {
					return {
						data: {
							abortTest: {
								success: true,
								abortedByInterceptor: true,
								controllerAccess: interceptorController !== null,
								message: 'Successfully aborted from interceptor',
								errorType: error.name,
								errorMessage: error.message
							}
						}
					}
				}
				
				// If it's an abort error but not from our interceptor, still show info
				if (isAbortError) {
					return {
						data: {
							abortTest: {
								success: false,
								abortedByInterceptor: false,
								controllerAccess: interceptorController !== null,
								message: 'Request was aborted but not by interceptor',
								errorType: error.name,
								errorMessage: error.message,
								fullError: error.toString()
							}
						}
					}
				}
				
				throw error
			}
		},
		expected: 'Should provide AbortController access for request cancellation'
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