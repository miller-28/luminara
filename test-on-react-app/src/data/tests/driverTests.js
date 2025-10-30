// driverTests.js - Driver Comparison Tests
// Contains tests comparing different driver implementations

import { createLuminara, OfetchDriver } from '../../services/luminaraService'

// Driver comparison test
export const driverTests = [
	{
		name: 'OfetchDriver vs NativeFetchDriver Test',
		call: async (abortSignal, api) => {
			console.log('🧪 Testing OfetchDriver vs NativeFetchDriver behavior')
			
			// Test with OfetchDriver (should behave like raw ofetch)
			const ofetchApi = createLuminara({
				driver: new OfetchDriver({
					retry: 2,
					retryDelay: 500
				})
			})
			
			try {
				await ofetchApi.get('https://httpbingo.org/status/503')
			} catch (error) {
				console.log('OfetchDriver error:', error.status || error.name)
			}
			
			// Test with NativeFetchDriver (default) 
			const nativeApi = createLuminara({
				retry: 2,
				retryDelay: 500
			})
			
			try {
				await nativeApi.get('https://httpbingo.org/status/503')
			} catch (error) {
				console.log('NativeFetchDriver error:', error.status || error.name)
			}
			
			return { message: 'Driver comparison complete - check console for details' }
		},
		expected: 'Driver comparison test - both drivers should handle 503 errors with retries'
	}
]