import { ofetch } from "ofetch";
import { createBackoffHandler } from "../core/backoff.js";

export function OfetchDriver(config = {}) {
	// Store global configuration
	const globalConfig = { ...config };

	// Customize ofetch instance once; users/plugins can hook via Luminara.
	const ofetchInstance = ofetch.create({
		// ofetch has native hooks; we keep them minimal here and
		// expose Luminara's plugin layer above.
		baseURL: config.baseURL,
		onRequest() {},
		onResponse() {},
		onResponseError() {}
	});

	return {
		async request(opts) {
			// Merge global config with per-request options (per-request takes priority)
			const mergedOpts = { ...globalConfig, ...opts };
			
			const { 
				url, method = "GET", headers, query, body, signal, 
				timeout, retry, retryDelay, retryStatusCodes,
				backoffType, backoffMaxDelay
			} = mergedOpts;
			
			// Map Luminara's options to ofetch's options
			const ofetchOptions = { method, headers, query, body, signal };
			
			// Handle timeout manually since ofetch timeout is unreliable
			let timeoutId;
			let combinedSignal = signal;
			
			if (timeout !== undefined && timeout > 0) {
				const timeoutController = new AbortController();
				timeoutId = setTimeout(() => {
					timeoutController.abort();
				}, timeout);
				
				// Combine user signal with timeout signal
				if (signal) {
					const combinedController = new AbortController();
					const cleanup = () => combinedController.abort();
					signal.addEventListener('abort', cleanup);
					timeoutController.signal.addEventListener('abort', cleanup);
					combinedSignal = combinedController.signal;
				} else {
					combinedSignal = timeoutController.signal;
				}
			}
			
			ofetchOptions.signal = combinedSignal;
			
			// Handle retry options for legacy requests (enhanced interceptors handle their own retry)
			if (retry !== undefined) {
				ofetchOptions.retry = retry;
			}
			if (retryStatusCodes !== undefined) {
				ofetchOptions.retryStatusCodes = retryStatusCodes;
			}
			
			// Handle retry delay logic: use backoff strategy if specified, otherwise use static delay
			if (backoffType) {
				// Use Luminara's backoff strategy - this returns a function
				const backoffDelayFunction = createBackoffHandler(backoffType, retryDelay, backoffMaxDelay);
				if (backoffDelayFunction) {
					ofetchOptions.retryDelay = backoffDelayFunction;
				}
			} else if (retryDelay !== undefined) {
				// Use static retry delay
				ofetchOptions.retryDelay = retryDelay;
			}
			
			// Note: ofetch throws on non-2xx; we'll normalize in Luminara layer if needed.
			try {
				const responseData = await ofetchInstance(url, ofetchOptions);
				// Clear timeout if request succeeded
				if (timeoutId) {
					clearTimeout(timeoutId);
				}
				// ofetch returns parsed body; raw headers/status require raw mode.
				// For now we return a minimal normalized shape.
				return { status: 200, headers: new Headers(), data: responseData };
			} catch (error) {
				// Clear timeout on error
				if (timeoutId) {
					clearTimeout(timeoutId);
				}
				
				// Convert timeout abort to timeout error
				if (combinedSignal && combinedSignal.aborted && timeout !== undefined) {
					const timeoutError = new Error(`Request timeout after ${timeout}ms`);
					timeoutError.name = 'TimeoutError';
					throw timeoutError;
				}
				
				// Preserve HTTP status code from ofetch error for retry logic
				if (error.status) {
					const httpError = new Error(error.message || `HTTP ${error.status}`);
					httpError.status = error.status;
					httpError.statusText = error.statusText;
					httpError.data = error.data;
					httpError.response = error.response;
					throw httpError;
				}
				
				// Re-throw other errors
				throw error;
			}
		}
	};
}
