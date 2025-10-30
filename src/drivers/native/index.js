import { buildFullUrl } from "./features/url/index.js";
import { createTimeoutHandler } from "./features/timeout/index.js";
import { parseResponseData } from "./features/response/index.js";
import { enhanceError, createHttpError, createTimeoutError, createParseError, createAbortError } from "./features/error/index.js";
import { shouldRetryRequest, calculateRetryDelay, createRetryContext, createRetryPolicy } from "./features/retry/index.js";

export function NativeFetchDriver(config = {}) {
	// Store global configuration
	const globalConfig = { ...config };

	return {
		async request(opts) {
			// Merge global config with per-request options (per-request takes priority)
			const mergedOpts = { ...globalConfig, ...opts };
			
			const { 
				url, method = "GET", headers, query, body, signal, 
				timeout, retry = 0, retryDelay = 1000, retryStatusCodes,
				backoffType, backoffMaxDelay, shouldRetry // Add custom retry policy support
			} = mergedOpts;
			
			// Convert retryStatusCodes to custom retry policy if provided
			let effectiveRetryPolicy = shouldRetry;
			if (retryStatusCodes && !shouldRetry) {
				const statusCodeSet = Array.isArray(retryStatusCodes) ? new Set(retryStatusCodes) : retryStatusCodes;
				effectiveRetryPolicy = createRetryPolicy({ retryStatusCodes: statusCodeSet });
			}
			
			// Build complete URL with baseURL and query parameters
			const fullUrl = buildFullUrl(url, mergedOpts.baseURL, query);
			
			// Setup timeout handling with signal combination
			const { signal: combinedSignal, cleanup: timeoutCleanup } = createTimeoutHandler(timeout, signal);
			
			// Prepare fetch options
			const fetchOptions = {
				method,
				headers: headers || {},
				signal: combinedSignal
			};
			
			// Handle body for POST/PUT/PATCH requests
			if (body !== undefined && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
				if (typeof body === 'string' || body instanceof URLSearchParams || body instanceof FormData) {
					fetchOptions.body = body;
				} else {
					fetchOptions.body = JSON.stringify(body);
					fetchOptions.headers['Content-Type'] = fetchOptions.headers['Content-Type'] || 'application/json';
				}
			}
			
			// Create request context for error handling
			const requestContext = {
				url: fullUrl,
				method,
				headers: fetchOptions.headers,
				body,
				retry,
				retryDelay,
				responseType: mergedOpts.responseType,
				ignoreResponseError: mergedOpts.ignoreResponseError,
				parseResponse: mergedOpts.parseResponse
			};
			
			// Implement single request execution (no driver-level retry loop)
			// LuminaraClient will handle retries and call us for each attempt
			try {
				const response = await fetch(fullUrl, fetchOptions);
				
				// Clear timeout if request succeeded
				timeoutCleanup();
				
				// Parse response data based on parseResponse and responseType options
				let data;
				try {
					data = await parseResponseData(response, mergedOpts.responseType, mergedOpts.parseResponse);
				} catch (parseError) {
					throw createParseError(parseError, response, requestContext, timeout);
				}
				
				// For non-2xx responses, check ignoreResponseError option
				if (!response.ok && !mergedOpts.ignoreResponseError) {
					throw createHttpError(response, data, requestContext, timeout);
				}
				
				return {
					status: response.status,
					headers: response.headers,
					data
				};
				
			} catch (error) {
				// Clear timeout on error
				timeoutCleanup();
				
				// Handle string abort reasons (convert to proper Error objects)
				if (typeof error === 'string') {
					error = createAbortError(error, requestContext, timeout);
				}
				
				// Convert timeout abort to timeout error
				if (combinedSignal && combinedSignal.aborted && timeout !== undefined) {
					throw createTimeoutError(timeout, requestContext);
				}
				
				// Enhance error with context and throw
				throw enhanceError(error, requestContext, timeout);
			}
		},

		// Provide shouldRetry method for LuminaraClient to use
		shouldRetry(error, context) {
			// Extract retry configuration from context
			const { retry = 0, retryStatusCodes, shouldRetry, backoffType, backoffMaxDelay } = context.req || {};
			
			// Convert retryStatusCodes to custom retry policy if provided
			let effectiveRetryPolicy = shouldRetry;
			if (retryStatusCodes && !shouldRetry) {
				const statusCodeSet = Array.isArray(retryStatusCodes) ? new Set(retryStatusCodes) : retryStatusCodes;
				effectiveRetryPolicy = createRetryPolicy({ retryStatusCodes: statusCodeSet });
			}
			
			// Create retry context for policy evaluation
			const retryContext = createRetryContext(
				context.req.url, 
				context.req.method || 'GET', 
				context.req.headers || {}, 
				retry, 
				context.attempt || 1,
				null, // response
				error
			);
			
			// Use driver's sophisticated retry logic
			return shouldRetryRequest(error, retryContext, effectiveRetryPolicy);
		},

		// Provide calculateRetryDelay method for LuminaraClient to use
		async calculateRetryDelay(context) {
			const { retry = 0, retryDelay = 1000, backoffType, backoffMaxDelay, attempt = 1 } = context.req || {};
			
			// Create retry context
			const retryContext = createRetryContext(
				context.req.url, 
				context.req.method || 'GET', 
				context.req.headers || {}, 
				retry, 
				context.attempt || 1,
				null, // response
				context.error
			);
			
			// Use driver's sophisticated delay calculation
			return await calculateRetryDelay(context.attempt || 1, retryDelay, backoffType, backoffMaxDelay, retryContext);
		}
	};
}