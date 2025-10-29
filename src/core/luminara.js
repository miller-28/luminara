import { OfetchDriver } from "../drivers/ofetch.js";

export class LuminaraClient {

	constructor(driver = OfetchDriver(), plugins = [], config = {}) {
		this.driver = driver;
		this.plugins = plugins;
		this.config = config; // Store global configuration
	}

	use(plugin) {
		this.plugins.push(plugin); 
		return this; 
	}

	async request(req) {
		// Merge global config with per-request options (per-request takes priority)
		const mergedReq = { ...this.config, ...req };
		
		// Use enhanced interceptor system when any modern interceptor hooks are present
		const hasEnhancedInterceptors = this.plugins.some(plugin => 
			plugin.onRequest || plugin.onResponse || plugin.onResponseError
		);

		if (hasEnhancedInterceptors) {
			// Use enhanced interceptor system with deterministic order and mutable context
			let context = {
				req: { ...mergedReq },
				res: null,
				error: null,
				attempt: 1,
				controller: new AbortController(),
				meta: {}
			};

			// Merge user's AbortController signal if provided
			if (mergedReq.signal) {
				const userSignal = mergedReq.signal;
				const cleanup = () => context.controller.abort();
				userSignal.addEventListener('abort', cleanup);
			}

			context.req.signal = context.controller.signal;

			return this.#executeWithRetry(context);
		} else {
			// Use legacy system with ofetch's built-in retry for backward compatibility
			return this.#executeLegacyRequest(mergedReq);
		}
	}

	async #executeWithRetry(context) {
		const maxAttempts = context.req.retry ? context.req.retry + 1 : 1;

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			context.attempt = attempt;
			context.error = null;
			context.res = null;

			try {
				// On retry, re-run request interceptors for fresh tokens/headers
				if (attempt > 1) {
					context.req = { ...context.req }; // Fresh copy for retry
				}

				// 1) onRequest interceptors (L→R order)
				for (const plugin of this.plugins) {
					if (plugin.onRequest) {
						// Check if this is a legacy plugin by inspecting function signature
						const fnString = plugin.onRequest.toString();
						const isLegacyPlugin = fnString.includes('request') && !fnString.includes('context');
						
						if (isLegacyPlugin) {
							// Legacy plugin expects just the request object
							const result = await plugin.onRequest(context.req);
							if (result && typeof result === 'object') {
								context.req = result;
							}
						} else {
							// Enhanced plugin expects context object  
							const result = await plugin.onRequest(context);
							if (result && result !== context) {
								context.req = result;
							}
						}
					}
				}

				// 2) Execute driver request
				context.res = await this.driver.request(context.req);

				// 3) Legacy onSuccess plugins first (L→R order)
				for (const plugin of this.plugins) {
					if (plugin.onSuccess && !plugin.onResponse && !plugin.onResponseError) {
						// Pure legacy plugin: onSuccess(response, request)
						context.res = await plugin.onSuccess(context.res, context.req) || context.res;
					}
				}

				// 4) Enhanced onResponse interceptors (R→L order - reverse execution)
				for (let i = this.plugins.length - 1; i >= 0; i--) {
					const plugin = this.plugins[i];
					if (plugin.onResponse) {
						await plugin.onResponse(context);
					}
				}

				// Success - return the response
				return context.res;

			} catch (error) {
				context.error = error;

				// 4) onResponseError interceptors (R→L order - reverse execution)
				// Also support legacy onError for backward compatibility
				for (let i = this.plugins.length - 1; i >= 0; i--) {
					const plugin = this.plugins[i];
					if (plugin.onResponseError) {
						await plugin.onResponseError(context);
					} else if (plugin.onError) {
						// Legacy support: onError(error, request)
						await plugin.onError(context.error, context.req);
					}
				}

				// Check if we should retry
				if (attempt < maxAttempts && this.#shouldRetry(error, context.req)) {
					// Apply retry delay
					const delay = this.#getRetryDelay(context);
					if (delay > 0) {
						await new Promise(resolve => setTimeout(resolve, delay));
					}
					continue; // Retry
				}

				// No more retries - throw the error
				throw context.error;
			}
		}
	}

	async #executeLegacyRequest(req) {
		// Legacy system: execute driver directly with ofetch's built-in retry
		try {
			const response = await this.driver.request(req);
			
			// Apply legacy onSuccess plugins
			let finalResponse = response;
			for (const plugin of this.plugins) {
				if (plugin.onSuccess) {
					const result = await plugin.onSuccess(finalResponse, req);
					if (result) {
						finalResponse = result;
					}
				}
			}
			
			return finalResponse;
		} catch (error) {
			// Apply legacy onError plugins
			for (const plugin of this.plugins) {
				if (plugin.onError) {
					await plugin.onError(error, req);
				}
			}
			throw error;
		}
	}

	#shouldRetry(error, req) {
		// Check custom retry status codes first
		if (req.retryStatusCodes && error.status) {
			return req.retryStatusCodes.includes(error.status);
		}
		
		// Default retry logic for server errors (5xx) and specific client errors
		if (error.status) {
			// Server errors (5xx) - generally retryable
			if (error.status >= 500) {
				return true;
			}
			// Auth errors (401) - retryable for auth refresh scenarios
			if (error.status === 401) {
				return true;
			}
			// Request timeout (408) - retryable
			if (error.status === 408) {
				return true;
			}
			// Too many requests (429) - retryable with backoff
			if (error.status === 429) {
				return true;
			}
		}
		
		// Network errors without status (connection issues) - retryable
		if (!error.status) {
			return true;
		}
		
		return false;
	}

	#getRetryDelay(context) {
		const { req, attempt } = context;
		if (typeof req.retryDelay === 'function') {
			return req.retryDelay(context);
		}
		return req.retryDelay || 1000;
	}

	// -------- Core verbs --------
	get(url, options = {}) {
		return this.request({ ...options, url, method: "GET" });
	}
	
	post(url, body, options = {}) {
		return this.request({ ...options, url, method: "POST", body });
	}
	
	put(url, body, options = {}) {
		return this.request({ ...options, url, method: "PUT", body });
	}
	
	patch(url, body, options = {}) {
		return this.request({ ...options, url, method: "PATCH", body });
	}
	
	del(url, options = {}) {
		return this.request({ ...options, url, method: "DELETE" });
	}
	
	head(url, options = {}) {
		return this.request({ ...options, url, method: "HEAD" });
	}
	
	options(url, options = {}) {
		return this.request({ ...options, url, method: "OPTIONS" });
	}

	// -------- Typed GET helpers (response content) --------
	getText(url, options = {}) {
		return this.get(url, this.#withAccept(options, 'text/plain', 'text'));
	}
	getJson(url, options = {}) {
		return this.get(url, this.#withAccept(options, 'application/json', 'json'));
	}
	getXml(url, options = {}) {
		return this.get(url, this.#withAccept(options, 'application/xml, text/xml, application/soap+xml', 'xml'));
	}
	getHtml(url, options = {}) {
		return this.get(url, this.#withAccept(options, 'text/html', 'html'));
	}
	getBlob(url, options = {}) {
		return this.get(url, this.#withAccept(options, '*/*', 'blob'));
	}
	getArrayBuffer(url, options = {}) {
		return this.get(url, this.#withAccept(options, 'application/octet-stream', 'arrayBuffer'));
	}
	// NDJSON: expect driver to stream/iterate, or return text and split lines upstream
	getNDJSON(url, options = {}) {
		return this.get(url, this.#withAccept(options, 'application/x-ndjson', 'ndjson'));
	}

	// -------- Typed POST/PUT/PATCH helpers (request content) --------
	postJson(url, data, options = {}) {
		return this.post(url, JSON.stringify(data), this.#withType(options, 'application/json', 'json'));
	}
	putJson(url, data, options = {}) {
		return this.put(url, JSON.stringify(data), this.#withType(options, 'application/json', 'json'));
	}
	patchJson(url, data, options = {}) {
		return this.patch(url, JSON.stringify(data), this.#withType(options, 'application/json', 'json'));
	}

	postText(url, text, options = {}) {
		return this.post(url, String(text), this.#withType(options, 'text/plain', 'text'));
	}

	postForm(url, data, options = {}) {
		const body = data instanceof URLSearchParams ? data : new URLSearchParams(data);
		// note: URLSearchParams auto-encodes; body will be used directly
		return this.post(url, body, this.#withType(options, 'application/x-www-form-urlencoded', 'text'));
	}

	postMultipart(url, formData, options = {}) {
		// Important: do NOT set Content-Type; browser sets boundary for FormData.
		const { headers = {}, responseType } = options;
		const safeOptions = { ...options, headers: { ...headers }, responseType: responseType ?? 'json' };
		return this.post(url, formData, safeOptions);
	}

	// SOAP 1.1/1.2 helper (XML envelope)
	postSoap(url, xmlString, options = {}) {
		const { headers = {} } = options;
		// If user provided SOAPAction, keep it; else omit.
		const hasSoap12 = String(headers['Content-Type'] || '').includes('application/soap+xml');
		const type = hasSoap12 ? 'application/soap+xml' : 'text/xml';
		return this.post(url, xmlString, this.#withType(options, type, 'xml'));
	}

	// -------- Private helpers --------
	#withAccept(options, accept, responseType) {
		const headers = { ...(options.headers || {}) };
		if (!headers['Accept']) headers['Accept'] = accept;
		return { ...options, headers, responseType: options.responseType ?? responseType };
	}

	#withType(options, contentType, defaultResponseType) {
		const headers = { ...(options.headers || {}) };
		if (!headers['Content-Type']) headers['Content-Type'] = contentType;
		return { ...options, headers, responseType: options.responseType ?? defaultResponseType };
	}
}