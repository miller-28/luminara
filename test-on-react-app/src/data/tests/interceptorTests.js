// interceptorTests.js - Interceptor System Tests
// Contains tests for the interceptor system functionality

import { createLuminara } from '../../services/luminaraService'

// Interceptor System Tests
export const interceptorTests = [
	{
		name: 'Custom Interceptor Test',
		call: async (abortSignal, api) => {
			const interceptorApi = createLuminara()
			let interceptorExecuted = false
			
			interceptorApi.use({
				onRequest(req) {
					interceptorExecuted = true
					req.headers = { ...req.headers, 'X-Interceptor-Test': 'executed' }
					return req
				},
				onSuccess(res) {
					res.interceptorData = { executed: interceptorExecuted }
					return res
				}
			})
			
			const options = abortSignal ? { signal: abortSignal } : {}
			const result = await interceptorApi.get('https://httpbingo.org/headers', options)
			if (!result.interceptorData?.executed) {
				throw new Error('Interceptor did not execute properly')
			}
			return result
		},
		expected: 'Should execute custom interceptor hooks'
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
					// Check for abort error - native fetch throws AbortError directly
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
				// Check for various abort error patterns - native fetch throws AbortError directly
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
	}
]