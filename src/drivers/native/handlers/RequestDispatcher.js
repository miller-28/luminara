/**
 * RequestDispatcher - Pre-flight request coordination (PHASE 1)
 * 
 * Responsibilities:
 * 1. Build complete URL from config
 * 2. Deduplicate concurrent identical requests
 * 3. Debounce duplicate requests
 * 4. Apply rate limiting with internal queue
 * 
 * This is the entry point for all requests before execution.
 */

import { buildFullUrl } from '../features/url/index.js';
import { urlLogger } from '../features/url/verboseLogger.js';

/**
 * Dispatch request through pre-flight pipeline
 * Coordinates URL building, debouncing, and rate limiting before execution
 * 
 * @param {object} config - Request configuration
 * @param {object} context - Request context
 * @param {object} features - Driver features (debouncer, rateLimiter)
 * @param {Function} executeFunction - Function to execute the actual request
 * @returns {Promise} Result of the request execution
 */
export async function dispatchRequest(config, context, features = {}, executeFunction) {
	const {
		url, baseURL, query, method = 'GET', headers, body,
		signal, timeout, retry = 0, retryDelay = 1000,
		retryStatusCodes, backoffType, backoffMaxDelay, shouldRetry,
		responseType, ignoreResponseError, parseResponse, verbose,
		debounce, rateLimit, deduplicate, hedging
	} = config;
	
	const { debouncer, rateLimiter, deduplicator, globalDebounce, globalRateLimit, globalDeduplicate } = features;
	
	//  ═══════════════════════════════════════════════════════════════
	//  STEP 1: Build complete URL
	//  ═══════════════════════════════════════════════════════════════
	
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
	
	// Create prepared request object
	const preparedRequest = {
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
		hedging,
		context
	};
	
	//  ═══════════════════════════════════════════════════════════════
	//  STEP 2: Apply deduplication (prevents duplicate concurrent requests)
	//  ═══════════════════════════════════════════════════════════════
	
	// Determine if deduplication should be applied
	const effectiveDeduplicate = deduplicate !== undefined ? deduplicate : globalDeduplicate;
	const shouldDeduplicate = effectiveDeduplicate && effectiveDeduplicate !== false && deduplicator;
	
	// Create execution function wrapper
	let executionFn = () => executeFunction(preparedRequest);
	
	// Wrap execution with deduplication if enabled
	if (shouldDeduplicate) {
		const requestDeduplicateConfig = typeof effectiveDeduplicate === 'object' ? effectiveDeduplicate : {};
		const deduplicationWrapper = async () => {
			return await deduplicator.process(
				preparedRequest,
				() => executeFunction(preparedRequest),
				requestDeduplicateConfig
			);
		};
		executionFn = deduplicationWrapper;
	}
	
	//  ═══════════════════════════════════════════════════════════════
	//  STEP 3: Apply debouncing (delays execution)
	//  ═══════════════════════════════════════════════════════════════
	
	// Determine if debouncing should be applied
	const effectiveDebounce = debounce !== undefined ? debounce : globalDebounce;
	const shouldDebounce = effectiveDebounce && effectiveDebounce !== false && debouncer;
	
	// Wrap execution with debouncing if enabled
	if (shouldDebounce) {
		const requestDebounceConfig = typeof effectiveDebounce === 'object' ? effectiveDebounce : {};
		const previousFn = executionFn;
		executionFn = async () => {
			return await debouncer.process(
				{ ...preparedRequest, ...requestDebounceConfig },
				previousFn
			);
		};
	}
	
	//  ═══════════════════════════════════════════════════════════════
	//  STEP 4: Apply rate limiting (throttles/queues request execution)
	//  ═══════════════════════════════════════════════════════════════
	
	// Determine if rate limiting should be applied
	const effectiveRateLimit = rateLimit !== undefined ? rateLimit : globalRateLimit;
	const shouldRateLimit = effectiveRateLimit && effectiveRateLimit !== false && rateLimiter;
	
	// Apply rate limiting if enabled
	if (shouldRateLimit) {
		return await rateLimiter.schedule(preparedRequest, executionFn);
	}
	
	// Execute directly if no rate limiting
	return await executionFn();
}
