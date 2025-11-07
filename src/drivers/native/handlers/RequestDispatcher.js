/**
 * RequestDispatcher - Pre-flight request coordination
 * 
 * Responsibilities:
 * 1. Build complete URL from config
 * 2. Debounce duplicate requests (future)
 * 3. Apply rate limiting with internal queue (future)
 * 
 * This is the entry point for all requests before execution.
 */

import { buildFullUrl } from '../features/url/index.js';
import { urlLogger } from '../features/url/verboseLogger.js';

/**
 * Prepare request for execution
 * Handles pre-flight concerns: URL building, debouncing, rate limiting
 * 
 * @param {object} config - Request configuration
 * @param {object} context - Request context
 * @returns {object} Prepared request configuration
 */
export function prepareRequest(config, context) {
	const {
		url, baseURL, query, method = 'GET', headers, body,
		signal, timeout, retry = 0, retryDelay = 1000,
		retryStatusCodes, backoffType, backoffMaxDelay, shouldRetry,
		responseType, ignoreResponseError, parseResponse, verbose
	} = config;
	
	// 1. Build complete URL
	const fullUrl = buildFullUrl(url, baseURL, query);
	
	// Log URL construction if verbose
	if (verbose) {
		const urlComponents = new URL(fullUrl);
		urlLogger.logFinalUrlConstruction(context, fullUrl, {
			protocol: urlComponents.protocol,
			host: urlComponents.host,
			pathname: urlComponents.pathname,
			search: urlComponents.search
		});
	}
	
	// 2. Debounce duplicate requests (FUTURE FEATURE - Placeholder)
	// if (this.debouncer && config.debounce) {
	//   const debounced = await this.debouncer.check(fullUrl, config);
	//   if (debounced) return debounced; // Return existing pending request
	// }
	
	// 3. Apply rate limiting (FUTURE FEATURE - Placeholder)
	// if (this.rateLimiter && config.rateLimit) {
	//   await this.rateLimiter.schedule(fullUrl, config);
	// }
	
	return {
		fullUrl,
		method,
		headers,
		body,
		query,
		signal,
		timeout,
		retry,
		retryDelay,
		retryStatusCodes,
		backoffType,
		backoffMaxDelay,
		shouldRetry,
		responseType,
		ignoreResponseError,
		parseResponse,
		verbose,
		context
	};
}
