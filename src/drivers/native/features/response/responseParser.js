/**
 * Response parsing utilities for different response types
 * Handles responseType options and custom parseResponse functions
 */

import { logResponse } from "../../../../core/verboseLogger.js";

export async function parseResponseData(response, responseType = 'auto', parseResponse, context = null) {
	// Log response received
	if (context) {
		logResponse(context, 'received', {
			status: response.status,
			type: responseType,
			size: response.headers.get('content-length') || 'unknown'
		});
	}
	
	// If custom parseResponse function is provided, use it with precedence
	if (typeof parseResponse === 'function') {
		if (context) {
			logResponse(context, 'parsing', {
				type: 'custom',
				contentType: response.headers.get('content-type')
			});
		}
		const responseText = await response.text();
		const result = parseResponse(responseText, response);
		if (context) {
			logResponse(context, 'parsed', {
				type: 'custom',
				resultType: typeof result
			});
		}
		return result;
	}
	
	// Handle specific response types
	if (responseType === 'blob') {
		if (context) {
			logResponse(context, 'parsing', { type: 'blob' });
		}
		const result = await response.blob();
		if (context) {
			logResponse(context, 'parsed', { type: 'blob', resultType: 'Blob' });
		}
		return result;
	} else if (responseType === 'stream') {
		if (context) {
			logResponse(context, 'parsing', { type: 'stream' });
			logResponse(context, 'parsed', { type: 'stream', resultType: 'ReadableStream' });
		}
		return response.body; // ReadableStream
	} else if (responseType === 'text') {
		if (context) {
			logResponse(context, 'parsing', { type: 'text' });
		}
		const result = await response.text();
		if (context) {
			logResponse(context, 'parsed', { type: 'text', resultType: 'string' });
		}
		return result;
	} else if (responseType === 'json') {
		if (context) {
			logResponse(context, 'parsing', { type: 'json' });
		}
		const result = await response.json();
		if (context) {
			logResponse(context, 'parsed', { type: 'json', resultType: typeof result });
		}
		return result;
	} else if (responseType === 'arrayBuffer') {
		if (context) {
			logResponse(context, 'parsing', { type: 'arrayBuffer' });
		}
		const result = await response.arrayBuffer();
		if (context) {
			logResponse(context, 'parsed', { type: 'arrayBuffer', resultType: 'ArrayBuffer' });
		}
		return result;
	} else {
		// Auto-detect based on content-type (default behavior)
		const contentType = response.headers.get('content-type') || '';
		
		if (contentType.includes('application/json')) {
			if (context) {
				logResponse(context, 'parsing', {
					type: 'json (auto-detected)',
					contentType
				});
			}
			try {
				const result = await response.json();
				if (context) {
					logResponse(context, 'parsed', {
						type: 'json (auto-detected)',
						resultType: typeof result
					});
				}
				return result;
			} catch (jsonError) {
				// Try text fallback for auto-detection
				if (context) {
					logResponse(context, 'parsing', {
						type: 'text (json fallback)',
						contentType
					});
				}
				const result = await response.text();
				if (context) {
					logResponse(context, 'parsed', {
						type: 'text (json fallback)',
						resultType: 'string'
					});
				}
				return result;
			}
		} else {
			if (context) {
				logResponse(context, 'parsing', {
					type: 'text (auto-detected)',
					contentType
				});
			}
			const result = await response.text();
			if (context) {
				logResponse(context, 'parsed', {
					type: 'text (auto-detected)',
					resultType: 'string'
				});
			}
			return result;
		}
	}
}