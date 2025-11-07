/**
 * HeaderHelpers - HTTP header utilities
 * 
 * Responsibility: Manage Accept and Content-Type headers
 */

export class HeaderHelpers {
	
	/**
	 * Add Accept header to options
	 */
	withAccept(options, accept, responseType) {
		const headers = { ...(options.headers || {}) };
		if (!headers['Accept']) {
			headers['Accept'] = accept;
		}
		
		return { ...options, headers, responseType: options.responseType ?? responseType };
	}
	
	/**
	 * Add Content-Type header to options
	 */
	withType(options, contentType, defaultResponseType) {
		const headers = { ...(options.headers || {}) };
		if (!headers['Content-Type']) {
			headers['Content-Type'] = contentType;
		}
		
		return { ...options, headers, responseType: options.responseType ?? defaultResponseType };
	}

}
