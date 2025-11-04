/**
 * Response feature verbose logger
 * Handles detailed logging for response parsing, type detection, and transformation
 */

import { verboseLog, logResponse } from '../../../../core/verboseLogger.js';

export class ResponseVerboseLogger {
	/**
	 * Log response received event
	 */
	static logResponseReceived(context, response, responseSize) {
		if (!context?.req?.verbose) return;
		
		logResponse(context, 'received', {
			status: response?.status,
			statusText: response?.statusText,
			type: response?.type,
			size: responseSize
		});
	}

	/**
	 * Log response headers analysis
	 */
	static logResponseHeaders(context, headers, relevantHeaders = []) {
		if (!context?.req?.verbose) return;
		
		const headerInfo = {};
		relevantHeaders.forEach(headerName => {
			const value = headers?.get?.(headerName) || headers?.[headerName];
			if (value) {
				headerInfo[headerName] = value;
			}
		});

		verboseLog(context, 'RESPONSE', 'Analyzing response headers', {
			contentType: headers?.get?.('content-type') || headers?.['content-type'],
			contentLength: headers?.get?.('content-length') || headers?.['content-length'],
			...headerInfo
		});
	}

	/**
	 * Log response type detection
	 */
	static logResponseTypeDetection(context, detectedType, contentType, requestedType) {
		if (!context?.req?.verbose) return;
		
		verboseLog(context, 'RESPONSE', `Detected response type: ${detectedType}`, {
			detected: detectedType,
			contentType: contentType,
			requested: requestedType || 'auto',
			source: requestedType ? 'explicit' : 'content-type'
		});
	}

	/**
	 * Log response parsing start
	 */
	static logResponseParsingStart(context, parseType, contentType) {
		if (!context?.req?.verbose) return;
		
		logResponse(context, 'parsing', {
			type: parseType,
			contentType: contentType
		});
	}

	/**
	 * Log response parsing success
	 */
	static logResponseParsingSuccess(context, parseType, resultType, dataSize) {
		if (!context?.req?.verbose) return;
		
		logResponse(context, 'parsed', {
			type: parseType,
			resultType: resultType,
			size: dataSize
		});
	}

	/**
	 * Log response parsing error
	 */
	static logResponseParsingError(context, parseType, error, fallbackType) {
		if (!context?.req?.verbose) return;
		
		verboseLog(context, 'RESPONSE', `Failed to parse as ${parseType}: ${error.message}`, {
			parseType: parseType,
			error: error.name,
			fallback: fallbackType
		});
	}

	/**
	 * Log response transformation
	 */
	static logResponseTransformation(context, fromType, toType, transformer) {
		if (!context?.req?.verbose) return;
		
		verboseLog(context, 'RESPONSE', `Transforming response: ${fromType} → ${toType}`, {
			from: fromType,
			to: toType,
			transformer: transformer
		});
	}

	/**
	 * Log custom parseResponse function usage
	 */
	static logCustomParseResponse(context, hasCustomParser) {
		if (!context?.req?.verbose) return;
		
		if (hasCustomParser) {
			verboseLog(context, 'RESPONSE', 'Using custom parseResponse function', {
				parser: 'custom',
				source: 'options.parseResponse'
			});
		} else {
			verboseLog(context, 'RESPONSE', 'Using built-in response parsing', {
				parser: 'built-in',
				source: 'luminara'
			});
		}
	}

	/**
	 * Log response size information
	 */
	static logResponseSize(context, bodySize, headers) {
		if (!context?.req?.verbose) return;
		
		const contentLength = headers?.get?.('content-length') || headers?.['content-length'];
		const actualSize = bodySize;
		
		verboseLog(context, 'RESPONSE', 'Response size information', {
			declared: contentLength ? `${contentLength} bytes` : 'unknown',
			actual: actualSize ? `${actualSize} bytes` : 'unknown',
			compression: headers?.get?.('content-encoding') || 'none'
		});
	}

	/**
	 * Log response caching information
	 */
	static logResponseCaching(context, headers) {
		if (!context?.req?.verbose) return;
		
		const cacheControl = headers?.get?.('cache-control') || headers?.['cache-control'];
		const etag = headers?.get?.('etag') || headers?.['etag'];
		const lastModified = headers?.get?.('last-modified') || headers?.['last-modified'];
		
		if (cacheControl || etag || lastModified) {
			verboseLog(context, 'RESPONSE', 'Response caching headers detected', {
				cacheControl: cacheControl || 'none',
				etag: etag ? 'present' : 'none',
				lastModified: lastModified ? 'present' : 'none'
			});
		}
	}

	/**
	 * Log response streaming information
	 */
	static logResponseStreaming(context, isStreamable, transferEncoding) {
		if (!context?.req?.verbose) return;
		
		verboseLog(context, 'RESPONSE', `Response streaming: ${isStreamable ? 'supported' : 'not supported'}`, {
			streamable: isStreamable,
			transferEncoding: transferEncoding || 'none',
			bodyUsed: 'checking...'
		});
	}
}

// Convenience functions for direct usage
export function logResponseReceived(context, response, responseSize) {
	ResponseVerboseLogger.logResponseReceived(context, response, responseSize);
}

export function logResponseTypeDetection(context, detectedType, contentType, requestedType) {
	ResponseVerboseLogger.logResponseTypeDetection(context, detectedType, contentType, requestedType);
}

export function logResponseParsingSuccess(context, parseType, resultType, dataSize) {
	ResponseVerboseLogger.logResponseParsingSuccess(context, parseType, resultType, dataSize);
}

export function logResponseParsingError(context, parseType, error, fallbackType) {
	ResponseVerboseLogger.logResponseParsingError(context, parseType, error, fallbackType);
}