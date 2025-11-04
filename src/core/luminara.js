import { NativeFetchDriver } from "../drivers/native/index.js";
import { logRequest, logPlugin, logError, verboseLog } from "./verboseLogger.js";

export class LuminaraClient {

	constructor(driver = NativeFetchDriver(), plugins = [], config = {}) {
		this.driver = driver;
		this.plugins = plugins;
		this.config = config; // Store global configuration
		
		// Log client configuration if verbose is enabled
		if (config.verbose) {
			verboseLog(config, 'REQUEST', 'Luminara client configured', {
				driver: driver.constructor.name || 'unknown',
				plugins: plugins.length,
				hasGlobalConfig: Object.keys(config).length > 1, // More than just verbose
				verboseEnabled: true
			});
		}
	}

	use(plugin) {
		this.plugins.push(plugin);
		
		// Log plugin registration if verbose is enabled globally
		if (this.config.verbose) {
			verboseLog(this.config, 'PLUGIN', `Registered plugin: ${plugin.name || 'anonymous'}`, {
				pluginName: plugin.name || 'anonymous',
				totalPlugins: this.plugins.length,
				hasOnRequest: !!plugin.onRequest,
				hasOnResponse: !!plugin.onResponse,
				hasOnSuccess: !!plugin.onSuccess,
				hasOnError: !!plugin.onError,
				hasOnResponseError: !!plugin.onResponseError
			});
		}
		
		return this; 
	}

	async request(req) {
		// Merge global config with per-request options (per-request takes priority)
		const mergedReq = { ...this.config, ...req };
		
		// Log driver selection if verbose is enabled
		if (mergedReq.verbose) {
			verboseLog(mergedReq, 'REQUEST', `Using ${this.driver.constructor.name || 'unknown'} driver`, {
				driver: this.driver.constructor.name || 'unknown',
				hasCustomDriver: this.driver.constructor.name !== 'NativeFetchDriver',
				driverFeatures: this.#getDriverFeatures()
			});
		}
		
		// Always use enhanced interceptor system - no legacy mode
		let context = {
			req: { ...mergedReq },
			res: null,
			error: null,
			attempt: 1,
			controller: new AbortController(),
			meta: { requestStartTime: Date.now() }
		};

		// Merge user's AbortController signal if provided
		if (mergedReq.signal) {
			const userSignal = mergedReq.signal;
			const cleanup = () => context.controller.abort();
			userSignal.addEventListener('abort', cleanup);
			
			// Log signal combination if verbose
			if (mergedReq.verbose) {
				verboseLog(context, 'REQUEST', 'Combined user abort signal with internal signal', {
					hasUserSignal: true,
					signalAborted: userSignal.aborted,
					combinedSignals: 'user + internal'
				});
			}
		}

		context.req.signal = context.controller.signal;

		return this.#executeWithRetry(context);
	}

	#getDriverFeatures() {
		const features = [];
		if (this.driver.calculateRetryDelay) features.push('retry-calculation');
		if (this.driver.request) features.push('request');
		if (this.driver.constructor.name === 'OfetchDriver') features.push('ofetch-based');
		if (this.driver.constructor.name === 'NativeFetchDriver') features.push('native-fetch');
		return features;
	}

	async #executeWithRetry(context) {
		const maxAttempts = context.req.retry ? context.req.retry + 1 : 1;

		// Log initial request start
		logRequest(context, 'start');

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			context.attempt = attempt;
			context.error = null;
			context.res = null;

			// Log each attempt
			logRequest(context, 'attempt');

			try {
				// On retry, re-run request interceptors for fresh tokens/headers
				if (attempt > 1) {
					context.req = { ...context.req }; // Fresh copy for retry
				}

				// 1) onRequest interceptors (L→R order)
				const requestPlugins = this.plugins.filter(p => p.onRequest);
				if (requestPlugins.length > 0) {
					logPlugin(context, 'onRequest', {
						count: requestPlugins.length,
						names: requestPlugins.map(p => p.name || 'anonymous')
					});
				}
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
				const successPlugins = this.plugins.filter(p => p.onSuccess && !p.onResponse && !p.onResponseError);
				if (successPlugins.length > 0) {
					logPlugin(context, 'onSuccess', {
						count: successPlugins.length,
						names: successPlugins.map(p => p.name || 'anonymous')
					});
				}
				for (const plugin of this.plugins) {
					if (plugin.onSuccess && !plugin.onResponse && !plugin.onResponseError) {
						// Pure legacy plugin: onSuccess(response, request)
						context.res = await plugin.onSuccess(context.res, context.req) || context.res;
					}
				}

				// 4) Enhanced onResponse interceptors (R→L order - reverse execution)
				const responsePlugins = this.plugins.filter(p => p.onResponse);
				if (responsePlugins.length > 0) {
					logPlugin(context, 'onSuccess', {
						count: responsePlugins.length,
						names: responsePlugins.map(p => p.name || 'anonymous')
					});
				}
				for (let i = this.plugins.length - 1; i >= 0; i--) {
					const plugin = this.plugins[i];
					if (plugin.onResponse) {
						await plugin.onResponse(context);
					}
				}

				// Success - log completion and return the response
				const duration = Date.now() - context.meta.requestStartTime;
				logRequest(context, 'complete', { 
					duration, 
					status: context.res?.status || 200,
					attempt: context.attempt,
					retries: context.attempt - 1,
					responseType: typeof context.res?.data,
					url: context.req.url,
					method: context.req.method || 'GET'
				});
				
				// Log additional response details if verbose
				if (context.req.verbose) {
					verboseLog(context, 'RESPONSE', `Request completed successfully`, {
						finalAttempt: context.attempt,
						totalRetries: context.attempt - 1,
						responseStatus: context.res?.status,
						responseSize: context.res?.data ? (typeof context.res.data === 'string' ? context.res.data.length : 'object') : 'none',
						totalDuration: `${duration}ms`,
						successful: true
					});
				}
				
				return context.res;

			} catch (error) {
				context.error = error;

				// Log error details
				logError(context, 'caught', {
					type: error.name || 'Error',
					message: error.message,
					status: error.status,
					retryable: attempt < maxAttempts && this.#shouldRetry(error, context)
				});

				// 4) onResponseError interceptors (R→L order - reverse execution)
				// Also support legacy onError for backward compatibility
				const errorPlugins = this.plugins.filter(p => p.onResponseError || p.onError);
				if (errorPlugins.length > 0) {
					logPlugin(context, 'onResponseError', {
						count: errorPlugins.length,
						names: errorPlugins.map(p => p.name || 'anonymous'),
						status: error.status
					});
				}
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
				if (attempt < maxAttempts && this.#shouldRetry(error, context)) {
					// Apply retry delay
					const delay = await this.#getRetryDelay(context);
					if (delay > 0) {
						await new Promise(resolve => setTimeout(resolve, delay));
					}
					continue; // Retry
				}

				// No more retries - log final error and throw
				logError(context, 'final', {
					message: context.error.message
				});
				throw context.error;
			}
		}
	}

	#shouldRetry(error, context) {
		// Use driver's retry logic for sophisticated policy decisions
		if (this.driver.shouldRetry) {
			return this.driver.shouldRetry(error, context);
		}
		
		// Fallback to simple retry logic
		// Check custom retry status codes first
		if (context.req.retryStatusCodes && error.status) {
			return context.req.retryStatusCodes.includes(error.status);
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

	async #getRetryDelay(context) {
		// Use driver's retry delay calculation if available
		if (this.driver.calculateRetryDelay) {
			return await this.driver.calculateRetryDelay(context);
		}
		
		// Fallback to simple retry delay logic
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
		return this.post(url, body, this.#withType(options, 'application/x-www-form-urlencoded', 'auto'));
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