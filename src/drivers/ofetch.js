import { ofetch } from "ofetch";
import { createBackoffHandler } from "../core/backoff.js";

export function OfetchDriver(config = {}) {

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
			const { 
				url, method = "GET", headers, query, body, signal, 
				timeout, retry, retryDelay, retryStatusCodes,
				backoffType, backoffMaxDelay
			} = opts;
			
			// Map Luminara's options to ofetch's options
			const ofetchOptions = { method, headers, query, body, signal };
			if (timeout !== undefined) {
				ofetchOptions.timeout = timeout;
			}
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
			const responseData = await ofetchInstance(url, ofetchOptions);
			// ofetch returns parsed body; raw headers/status require raw mode.
			// For now we return a minimal normalized shape.
			return { status: 200, headers: new Headers(), data: responseData };
		}
	};
}
