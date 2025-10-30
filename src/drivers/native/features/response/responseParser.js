/**
 * Response parsing utilities for different response types
 * Handles responseType options and custom parseResponse functions
 */

export async function parseResponseData(response, responseType = 'auto', parseResponse) {
	// If custom parseResponse function is provided, use it with precedence
	if (typeof parseResponse === 'function') {
		const responseText = await response.text();
		return parseResponse(responseText, response);
	}
	
	// Handle specific response types
	if (responseType === 'blob') {
		return await response.blob();
	} else if (responseType === 'stream') {
		return response.body; // ReadableStream
	} else if (responseType === 'text') {
		return await response.text();
	} else if (responseType === 'json') {
		return await response.json();
	} else if (responseType === 'arrayBuffer') {
		return await response.arrayBuffer();
	} else {
		// Auto-detect based on content-type (default behavior)
		const contentType = response.headers.get('content-type') || '';
		
		if (contentType.includes('application/json')) {
			try {
				return await response.json();
			} catch (jsonError) {
				// Try text fallback for auto-detection
				return await response.text();
			}
		} else {
			return await response.text();
		}
	}
}