import { HeaderHelpers } from './HeaderHelpers.js';

/**
 * TypedRequests - Typed request helpers
 * 
 * Responsibility: Provide typed request methods (getJson, postForm, etc.)
 */

export class TypedRequests {
	
	constructor(client) {
		this.client = client;
		this.headerHelpers = new HeaderHelpers();
	}
	
	// -------- Typed GET helpers (response content) --------
	
	getText(url, options = {}) {
		return this.client.get(url, this.headerHelpers.withAccept(options, 'text/plain', 'text'));
	}
	
	getJson(url, options = {}) {
		return this.client.get(url, this.headerHelpers.withAccept(options, 'application/json', 'json'));
	}
	
	getXml(url, options = {}) {
		return this.client.get(url, this.headerHelpers.withAccept(options, 'application/xml, text/xml, application/soap+xml', 'xml'));
	}
	
	getHtml(url, options = {}) {
		return this.client.get(url, this.headerHelpers.withAccept(options, 'text/html', 'html'));
	}
	
	getBlob(url, options = {}) {
		return this.client.get(url, this.headerHelpers.withAccept(options, '*/*', 'blob'));
	}
	
	getArrayBuffer(url, options = {}) {
		return this.client.get(url, this.headerHelpers.withAccept(options, 'application/octet-stream', 'arrayBuffer'));
	}
	
	getNDJSON(url, options = {}) {
		return this.client.get(url, this.headerHelpers.withAccept(options, 'application/x-ndjson', 'ndjson'));
	}
	
	// -------- Typed POST/PUT/PATCH helpers (request content) --------
	
	postJson(url, data, options = {}) {
		return this.client.post(url, JSON.stringify(data), this.headerHelpers.withType(options, 'application/json', 'json'));
	}
	
	putJson(url, data, options = {}) {
		return this.client.put(url, JSON.stringify(data), this.headerHelpers.withType(options, 'application/json', 'json'));
	}
	
	patchJson(url, data, options = {}) {
		return this.client.patch(url, JSON.stringify(data), this.headerHelpers.withType(options, 'application/json', 'json'));
	}
	
	postText(url, text, options = {}) {
		return this.client.post(url, String(text), this.headerHelpers.withType(options, 'text/plain', 'text'));
	}
	
	postForm(url, data, options = {}) {
		const body = data instanceof URLSearchParams ? data : new URLSearchParams(data);
		
		// note: URLSearchParams auto-encodes; body will be used directly
		return this.client.post(url, body, this.headerHelpers.withType(options, 'application/x-www-form-urlencoded', 'auto'));
	}
	
	postMultipart(url, formData, options = {}) {

		// Important: do NOT set Content-Type; browser sets boundary for FormData.
		const { headers = {}, responseType } = options;
		const safeOptions = { ...options, headers: { ...headers }, responseType: responseType ?? 'json' };
		
		return this.client.post(url, formData, safeOptions);
	}
	
	postSoap(url, xmlString, options = {}) {
		const { headers = {} } = options;
		
		// If user provided SOAPAction, keep it; else omit.
		const hasSoap12 = String(headers['Content-Type'] || '').includes('application/soap+xml');
		const type = hasSoap12 ? 'application/soap+xml' : 'text/xml';
		
		return this.client.post(url, xmlString, this.headerHelpers.withType(options, type, 'xml'));
	}

}
