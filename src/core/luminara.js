import { OfetchDriver } from "../drivers/ofetch.js";

export class LuminaraClient {

	constructor(driver = OfetchDriver(), plugins = []) {
		this.driver = driver;
		this.plugins = plugins;
	}

	use(plugin) {
		this.plugins.push(plugin); 
		return this; 
	}

	async request(req) {

		// 1) run all onRequest
		let currentRequest = req;
		for (const plug of this.plugins) {
			if (plug.onRequest) 
				currentRequest = await plug.onRequest(currentRequest);
		}

		// 2) call driver once
		try {
			let response = await this.driver.request(currentRequest);

			// 3) run all onSuccess
			for (const plug of this.plugins) {
				if (plug.onSuccess) 
					response = await plug.onSuccess(response);
			}
			return response;
		} catch (error) {
			// 4) run all onError
			for (const plug of this.plugins) {
				if (plug.onError) await plug.onError(error, currentRequest);
			}
			throw error;
		}
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