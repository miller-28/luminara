/**
 * Response feature verbose logger
 * Handles detailed logging for response parsing, type detection, and transformation
 */

import { BaseVerboseLogger } from '../../../../core/verbose/BaseVerboseLogger.js';

export class ResponseVerboseLogger extends BaseVerboseLogger {
	
	constructor() {
		super('RESPONSE');
	}

	/**
	 * Log response received event
	 */
	logResponseReceived(context, response, responseSize) {
		this.log(context, 'RECEIVED', `Response received: ${response?.status} ${response?.statusText}`, {
			status: response?.status,
			statusText: response?.statusText,
			type: response?.type,
			size: responseSize,
			ok: response?.ok
		});
	}

	/**
	 * Log response headers analysis
	 */
	logResponseHeaders(context, headers, relevantHeaders = []) {
		const headerInfo = {};
		relevantHeaders.forEach(headerName => {
			headerInfo[headerName] = headers.get(headerName);
		});
		
		this.debug(context, 'HEADERS', 'Response headers analyzed', {
			...headerInfo,
			totalHeaders: headers.size || Object.keys(headers).length
		});
	}

	/**
	 * Log response type detection
	 */
	logResponseTypeDetection(context, contentType, detectedType, confidence) {
		this.log(context, 'TYPE', `Response type detected: ${detectedType}`, {
			contentType: contentType,
			detected: detectedType,
			confidence: confidence,
			source: 'content-type-header'
		});
	}

	/**
	 * Log response parsing attempt
	 */
	logResponseParsingAttempt(context, parserType, responseSize) {
		this.debug(context, 'PARSING', `Parsing response as ${parserType}`, {
			parser: parserType,
			size: responseSize,
			attempt: 'started'
		});
	}

	/**
	 * Log response parsing success
	 */
	logResponseParsingSuccess(context, parserType, resultSize) {
		this.log(context, 'PARSED', `Response successfully parsed as ${parserType}`, {
			parser: parserType,
			resultSize: resultSize,
			status: 'success'
		});
	}

	/**
	 * Log response parsing error
	 */
	logResponseParsingError(context, parserType, error) {
		this.error(context, 'PARSE_ERROR', `Failed to parse response as ${parserType}`, {
			parser: parserType,
			error: error.message,
			errorType: error.name
		});
	}
}

// Create singleton instance
const responseLogger = new ResponseVerboseLogger();

export { responseLogger };
