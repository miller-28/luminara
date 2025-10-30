// luminaraService.js - Services Layer
// Centralized Luminara client management and configuration

import { createLuminara as originalCreateLuminara, OfetchDriver } from '../../../src/index.js'

// Re-export drivers for testing
export { OfetchDriver }

// Default configuration for main API client
const defaultConfig = {
	retry: 3,
	retryDelay: 1500,
	backoffType: 'linear',
	retryStatusCodes: [408, 429, 500, 502, 503, 504]
}

// Create configured Luminara client
export const createLuminara = (customConfig = {}) => {
	const config = { ...defaultConfig, ...customConfig }
	return originalCreateLuminara(config)
}

// Pre-configured main API client
export const api = createLuminara()

// Specialized client configurations
export const createTimeoutClient = (timeout = 3000) => {
	return createLuminara({ timeout })
}

export const createRetryClient = (retryCount = 3, retryDelay = 1500) => {
	return createLuminara({ 
		retry: retryCount, 
		retryDelay,
		retryStatusCodes: [408, 429, 500, 502, 503, 504]
	})
}

export const createBackoffClient = (backoffType = 'exponential', baseDelay = 500, retries = 2) => {
	return createLuminara({
		retry: retries,
		retryDelay: baseDelay,
		backoffType,
		retryStatusCodes: [503]
	})
}

export const createBaseUrlClient = (baseURL) => {
	return createLuminara({ baseURL })
}

// Service configuration export
export const serviceConfig = {
	defaultRetries: 3,
	defaultRetryDelay: 1500,
	defaultBackoffType: 'linear',
	supportedStatusCodes: [408, 429, 500, 502, 503, 504],
	timeoutDefault: 3000
}