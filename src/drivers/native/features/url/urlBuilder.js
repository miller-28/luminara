/**
 * URL building utilities for drivers
 * Handles baseURL resolution and query parameter serialization
 */

export function buildFullUrl(url, baseURL, query) {
	// Build full URL with baseURL if provided
	let fullUrl = url;
	if (baseURL && !url.startsWith('http')) {
		fullUrl = baseURL.replace(/\/$/, '') + '/' + url.replace(/^\//, '');
	}
	
	// Add query parameters if provided
	if (query && Object.keys(query).length > 0) {
		const queryString = new URLSearchParams(query).toString();
		fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString;
	}
	
	return fullUrl;
}