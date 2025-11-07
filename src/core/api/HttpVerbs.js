/**
 * HttpVerbs - Core HTTP method helpers
 * 
 * Responsibility: Provide HTTP verb methods (GET, POST, PUT, etc.)
 */

export class HttpVerbs {
	
	constructor(client) {
		this.client = client;
	}
	
	get(url, options = {}) {
		return this.client.request({ ...options, url, method: 'GET' });
	}
	
	post(url, body, options = {}) {
		return this.client.request({ ...options, url, method: 'POST', body });
	}
	
	put(url, body, options = {}) {
		return this.client.request({ ...options, url, method: 'PUT', body });
	}
	
	patch(url, body, options = {}) {
		return this.client.request({ ...options, url, method: 'PATCH', body });
	}
	
	del(url, options = {}) {
		return this.client.request({ ...options, url, method: 'DELETE' });
	}
	
	head(url, options = {}) {
		return this.client.request({ ...options, url, method: 'HEAD' });
	}
	
	options(url, options = {}) {
		return this.client.request({ ...options, url, method: 'OPTIONS' });
	}

}
