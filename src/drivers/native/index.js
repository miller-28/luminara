import { prepareRequest } from './handlers/RequestDispatcher.js';
import { executeRequest } from './handlers/InFlightHandler.js';
import { handleErrorResponse } from './handlers/ErrorResponseHandler.js';
import { handleSuccessResponse } from './handlers/SuccessResponseHandler.js';
import { shouldRetryRequest, calculateRetryDelay, createRetryContext, createRetryPolicy } from './features/retry/index.js';
import { retryLogger } from './features/retry/verboseLogger.js';

/**
 * Native Fetch Driver for Luminara
 * 
 * Zero external dependencies. Uses Node.js/browser native fetch() API.
 * Handler-based architecture with clean separation of concerns:
 * - Request Dispatcher: URL building, rate limiting, debouncing (pre-flight)
 * - In-Flight Handler: Request execution with timeout (execution)
 * - Response Handlers: Error and success response processing (post-flight)
 * 
 * Supported options:
 * - url: string - Request URL (required)
 * - baseURL: string - Base URL to prepend
 * - method: string - HTTP method (GET, POST, etc.)
 * - headers: object - Request headers
 * - body: any - Request body
 * - query: object - URL query parameters
 * - timeout: number - Request timeout in ms
 * - signal: AbortSignal - AbortController signal
 * - retry: number - Max retry attempts (for shouldRetry logic)
 * - retryDelay: number|function - Delay between retries (for calculateRetryDelay logic)
 * - retryStatusCodes: Set|Array - HTTP status codes to retry
 * - shouldRetry: function - Custom retry policy
 * - backoffType: string - Backoff strategy (linear, exponential, decorrelated)
 * - backoffMaxDelay: number - Maximum backoff delay in ms
 * - responseType: string - Response parsing type (json, text, blob, etc.)
 * - ignoreResponseError: boolean - Don't throw on non-2xx responses
 * - parseResponse: boolean - Whether to parse response body
 * - verbose: boolean - Enable verbose logging
 * 
 * @param {object} config - Default options for all requests
 * @returns {object} Driver interface with request method
 */
export function NativeFetchDriver(config = {}) {

	// Store global configuration
	const globalConfig = { ...config };
	
	return {
		async request(opts, context = {}) {

			// Merge global config with per-request options (per-request takes priority)
			const mergedOpts = { ...globalConfig, ...opts };
			
			// Get current attempt from context (for error reporting)
			const currentAttempt = context.attempt || 1;
			
			//  ═══════════════════════════════════════════════════════════════
			//  PHASE 1: PRE-FLIGHT (Request Dispatcher)
			//  URL building, rate limiting, debouncing
			//  ═══════════════════════════════════════════════════════════════
			
			const preparedRequest = prepareRequest(mergedOpts, context);
			
			//  ═══════════════════════════════════════════════════════════════
			//  PHASE 2: IN-FLIGHT (Execute Request)
			//  Timeout handling, request execution
			//  ═══════════════════════════════════════════════════════════════
			
			try {
				const response = await executeRequest(preparedRequest, currentAttempt);
				
				//  ═══════════════════════════════════════════════════════════════
				//  PHASE 3: POST-FLIGHT (Response Handlers)
				//  Success path: Parse response data
				//  ═══════════════════════════════════════════════════════════════
				
				return await handleSuccessResponse(response, preparedRequest, currentAttempt);
			} catch (error) {

				//  ═══════════════════════════════════════════════════════════════
				//  PHASE 3: POST-FLIGHT (Response Handlers)
				//  Error path: Transform and enrich error information
				//  ═══════════════════════════════════════════════════════════════
				
				throw await handleErrorResponse(error, preparedRequest, currentAttempt);
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
				retryLogger.logRetryPolicyEvaluation(context, error, willRetry, 'native-driver-policy', 'native');
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
