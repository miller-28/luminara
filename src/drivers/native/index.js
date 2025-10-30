import { buildFullUrl } from "./utils/urlBuilder.js";
import { createTimeoutHandler } from "./utils/timeoutHandler.js";
import { parseResponseData } from "./utils/responseParser.js";
import { enhanceError, createHttpError, createTimeoutError, createParseError, createAbortError } from "./utils/errorHandler.js";
import { shouldRetryRequest, calculateRetryDelay, createRetryContext } from "./utils/retryHandler.js";

export function NativeFetchDriver(config = {}) {
	// Store global configuration
	const globalConfig = { ...config };

	return {
		async request(opts) {
			// Merge global config with per-request options (per-request takes priority)
			const mergedOpts = { ...globalConfig, ...opts };
			
			const { 
				url, method = "GET", headers, query, body, signal, 
				timeout, retry = 0, retryDelay = 1000, retryStatusCodes = [408, 429, 500, 502, 503, 504],
				backoffType, backoffMaxDelay
			} = mergedOpts;
			
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
			
			// Implement retry logic with backoff
			let lastError;
			const maxAttempts = retry + 1;
			
			for (let attempt = 1; attempt <= maxAttempts; attempt++) {
				try {
					const response = await fetch(fullUrl, fetchOptions);
					
					// Clear timeout if request succeeded
					timeoutCleanup();
					
					// Check if we should retry based on status code
					if (!response.ok && attempt < maxAttempts && retryStatusCodes.includes(response.status)) {
						// Prepare for retry with proper delay
						const retryContext = createRetryContext(fullUrl, method, fetchOptions.headers, retry, attempt, response);
						await calculateRetryDelay(attempt, retryDelay, backoffType, backoffMaxDelay, retryContext);
						continue;
					}
					
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
					
					lastError = error;
					
					// Convert timeout abort to timeout error
					if (combinedSignal && combinedSignal.aborted && timeout !== undefined) {
						throw createTimeoutError(timeout, requestContext);
					}
					
					// Check if we should retry
					if (attempt < maxAttempts && shouldRetryRequest(error, retryStatusCodes)) {
						const retryContext = createRetryContext(fullUrl, method, fetchOptions.headers, retry, attempt, null, error);
						await calculateRetryDelay(attempt, retryDelay, backoffType, backoffMaxDelay, retryContext);
						continue;
					}
					
					// No more retries, enhance and throw the error
					throw enhanceError(error, requestContext, timeout);
				}
			}
			
			// Should not reach here, but just in case
			throw lastError;
		}
	};
}