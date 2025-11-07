import { buildFullUrl } from "./features/url/index.js";
import { createTimeoutHandler } from "./features/timeout/index.js";
import { parseResponseData } from "./features/response/index.js";
import { createLuminaraError, createHttpError, createTimeoutError, createParseError, createAbortError, createNetworkError } from "./features/error/index.js";
import { shouldRetryRequest, calculateRetryDelay, createRetryContext, createRetryPolicy } from "./features/retry/index.js";
import { verboseLog } from "../../core/verbose/verboseLogger.js";
import { urlLogger } from "./features/url/verboseLogger.js";
import { timeoutLogger } from "./features/timeout/verboseLogger.js";
import { responseLogger } from "./features/response/verboseLogger.js";
import { errorLogger } from "./features/error/verboseLogger.js";
import { retryLogger } from "./features/retry/verboseLogger.js";

export function NativeFetchDriver(config = {}) {
	// Store global configuration
	const globalConfig = { ...config };

	return {
		async request(opts, context = {}) {
			// Merge global config with per-request options (per-request takes priority)
			const mergedOpts = { ...globalConfig, ...opts };
			
			const { 
				url, method = "GET", headers, query, body, signal, 
				timeout, retry = 0, retryDelay = 1000, retryStatusCodes,
				backoffType, backoffMaxDelay, shouldRetry // Add custom retry policy support
			} = mergedOpts;
			
			// Get current attempt from context (for error reporting)
			const currentAttempt = context.attempt || 1;
			
			// Convert retryStatusCodes to custom retry policy if provided
			let effectiveRetryPolicy = shouldRetry;
			if (retryStatusCodes && !shouldRetry) {
				const statusCodeSet = Array.isArray(retryStatusCodes) ? 
					new Set(retryStatusCodes) : retryStatusCodes;
				effectiveRetryPolicy = createRetryPolicy({ retryStatusCodes: statusCodeSet });
			}
			
			// Build complete URL with baseURL and query parameters
			const fullUrl = buildFullUrl(url, mergedOpts.baseURL, query);
			
			// Log URL building if verbose
			if (mergedOpts.verbose) {
				urlLogger.logFinalUrlConstruction(context, fullUrl, {
					protocol: new URL(fullUrl).protocol,
					host: new URL(fullUrl).host,
					pathname: new URL(fullUrl).pathname,
					search: new URL(fullUrl).search.substring(1) // Remove leading ?
				});
			}
			
			// Setup timeout handling with signal combination
			const { signal: combinedSignal, cleanup: timeoutCleanup } = 
				createTimeoutHandler(timeout, signal, context);
			
			// Log timeout configuration if verbose
			if (mergedOpts.verbose && timeout) {
				timeoutLogger.logTimeoutSetup(context, timeout, 'driver');
			}
			
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
				timeout,
				retry,
				retryDelay,
				responseType: mergedOpts.responseType,
				ignoreResponseError: mergedOpts.ignoreResponseError,
				parseResponse: mergedOpts.parseResponse
			};
			
			// Implement single request execution (no driver-level retry loop)
			// LuminaraClient will handle retries and call us for each attempt
			try {
				// Log request execution start if verbose
				if (mergedOpts.verbose) {
					verboseLog(context, 'REQUEST', `Executing native fetch: ${method.toUpperCase()} ${fullUrl}`, {
						method: method.toUpperCase(),
						url: fullUrl,
						hasBody: !!body,
						hasTimeout: !!timeout,
						attempt: currentAttempt
					});
				}
				
				const response = await fetch(fullUrl, fetchOptions);
				
				// Clear timeout if request succeeded
				timeoutCleanup();
				
				// Log response received if verbose
				if (mergedOpts.verbose) {
					responseLogger.logResponseReceived(context, response, 'unknown');
					responseLogger.logResponseHeaders(context, response.headers, ['content-type', 'content-length', 'cache-control']);
				}
				
				// Parse response data based on parseResponse and responseType options
				let data;
				try {
					data = await parseResponseData(response, mergedOpts.responseType, mergedOpts.parseResponse, context);
					
					// Log successful parsing if verbose
					if (mergedOpts.verbose) {
						responseLogger.logResponseParsingSuccess(context, mergedOpts.responseType || 'auto', typeof data, JSON.stringify(data).length);
					}
				} catch (parseError) {
					// Log parsing error if verbose
					if (mergedOpts.verbose) {
						responseLogger.logResponseParsingError(context, mergedOpts.responseType || 'auto', parseError, 'error');
					}
					throw await createParseError(parseError, response, requestContext, currentAttempt);
				}
				
				// For non-2xx responses, check ignoreResponseError option
				if (!response.ok && !mergedOpts.ignoreResponseError) {
					// Log HTTP error if verbose
					if (mergedOpts.verbose) {
						errorLogger.logHttpError(context, response, { status: response.status, data });
					}
					throw await createHttpError(response, requestContext, currentAttempt);
				}
				
				return {
					status: response.status,
					headers: response.headers,
					data
				};
				
			} catch (error) {
				// Clear timeout on error
				timeoutCleanup();
				
				// Log error caught in driver if verbose
				if (mergedOpts.verbose) {
					errorLogger.logErrorCaught(context, error, 'native-driver');
				}
				
				// Handle AbortError specifically
				if (error.name === 'AbortError') {
					// Check if this was a timeout abort
					if (combinedSignal && combinedSignal.aborted && timeout !== undefined) {
						if (mergedOpts.verbose) {
							errorLogger.logTimeoutError(context, error, timeout);
							errorLogger.logErrorTransformation(context, error, { name: 'TimeoutError' }, 'abort-to-timeout');
						}
						throw createTimeoutError(timeout, requestContext, currentAttempt);
					}
					// Otherwise it's a user-initiated abort
					if (mergedOpts.verbose) {
						errorLogger.logAbortError(context, error, 'user');
						errorLogger.logErrorTransformation(context, error, { name: 'AbortError' }, 'abort-signal');
					}
					throw createAbortError(error, requestContext, currentAttempt);
				}
				
				// Handle string abort reasons (convert to proper Error objects)
				if (typeof error === 'string') {
					if (mergedOpts.verbose) {
						errorLogger.logErrorTransformation(context, { name: 'String', message: error }, { name: 'AbortError' }, 'string-to-abort');
					}
					throw createAbortError(error, requestContext, currentAttempt);
				}
				
				// Handle TypeError (usually network errors)
				if (error.name === 'TypeError') {
					if (mergedOpts.verbose) {
						errorLogger.logNetworkError(context, error);
						errorLogger.logErrorTransformation(context, error, { name: 'NetworkError' }, 'type-error-to-network');
					}
					throw createNetworkError(error, requestContext, currentAttempt);
				}
				
				// If this is already a LuminaraError, just re-throw
				if (error.name === 'LuminaraError') {
					throw error;
				}
				
				// For any other error, create a generic LuminaraError
				if (mergedOpts.verbose) {
					errorLogger.logErrorTransformation(context, error, { name: 'LuminaraError' }, 'generic-error');
				}
				throw createLuminaraError(error.message, {
					request: requestContext,
					attempt: currentAttempt,
					originalError: error
				});
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
			const willRetry = shouldRetryRequest(error, retryContext, effectiveRetryPolicy);
			
			// Log retry decision if verbose
			if (context.req?.verbose) {
				retryLogger.logRetryPolicyEvaluation(context, error, willRetry, `native-driver-policy`, 'native');
			}
			
			return willRetry;
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
			
			// Use driver's sophisticated delay calculation, passing both retry context and Luminara context
			const delay = await calculateRetryDelay(context.attempt || 1, retryDelay, backoffType, backoffMaxDelay, retryContext, null, context);
			
			// Log delay calculation if verbose
			if (context.req?.verbose) {
				retryLogger.logRetryDelay(context, context.attempt || 1, delay, backoffType || 'static');
			}
			
			return delay;
		}
	};
}