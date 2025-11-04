/**
 * URL feature verbose logger
 * Handles detailed logging for URL building, base URL resolution, and query parameter processing
 */

import { verboseLog } from '../../../../core/verboseLogger.js';

export class UrlVerboseLogger {
	/**
	 * Log URL building start
	 */
	static logUrlBuildingStart(context, baseUrl, providedUrl) {
		if (!context?.req?.verbose) return;
		
		verboseLog(context, 'URL', 'Starting URL construction', {
			base: baseUrl || 'none',
			provided: providedUrl,
			hasBase: !!baseUrl
		});
	}

	/**
	 * Log base URL resolution
	 */
	static logBaseUrlResolution(context, baseUrl, source) {
		if (!context?.req?.verbose) return;
		
		verboseLog(context, 'URL', `Base URL resolved: ${baseUrl}`, {
			baseUrl: baseUrl,
			source: source, // 'options', 'global', 'default'
			absolute: baseUrl.startsWith('http')
		});
	}

	/**
	 * Log URL combination
	 */
	static logUrlCombination(context, baseUrl, relativePath, finalUrl) {
		if (!context?.req?.verbose) return;
		
		verboseLog(context, 'URL', `Combined URLs: ${baseUrl} + ${relativePath} → ${finalUrl}`, {
			base: baseUrl,
			relative: relativePath,
			final: finalUrl,
			operation: 'combine'
		});
	}

	/**
	 * Log absolute URL detection
	 */
	static logAbsoluteUrlDetected(context, url) {
		if (!context?.req?.verbose) return;
		
		verboseLog(context, 'URL', `Absolute URL detected: ${url}`, {
			url: url,
			protocol: url.split(':')[0],
			needsBase: false
		});
	}

	/**
	 * Log query parameter processing
	 */
	static logQueryProcessingStart(context, queryParams, source) {
		if (!context?.req?.verbose) return;
		
		const paramCount = queryParams ? Object.keys(queryParams).length : 0;
		
		verboseLog(context, 'URL', `Processing query parameters (${paramCount})`, {
			count: paramCount,
			source: source, // 'options', 'url', 'both'
			hasParams: paramCount > 0
		});
	}

	/**
	 * Log query parameter extraction from URL
	 */
	static logQueryExtractionFromUrl(context, originalUrl, extractedParams, cleanUrl) {
		if (!context?.req?.verbose) return;
		
		const paramCount = extractedParams ? Object.keys(extractedParams).length : 0;
		
		if (paramCount > 0) {
			verboseLog(context, 'URL', `Extracted ${paramCount} query parameters from URL`, {
				original: originalUrl,
				clean: cleanUrl,
				extracted: Object.keys(extractedParams),
				count: paramCount
			});
		}
	}

	/**
	 * Log query parameter merging
	 */
	static logQueryParameterMerging(context, urlParams, optionParams, mergedParams) {
		if (!context?.req?.verbose) return;
		
		const urlCount = urlParams ? Object.keys(urlParams).length : 0;
		const optionCount = optionParams ? Object.keys(optionParams).length : 0;
		const mergedCount = mergedParams ? Object.keys(mergedParams).length : 0;
		
		if (urlCount > 0 || optionCount > 0) {
			verboseLog(context, 'URL', `Merged query parameters: URL(${urlCount}) + Options(${optionCount}) = ${mergedCount}`, {
				urlParams: urlCount,
				optionParams: optionCount,
				total: mergedCount,
				conflicts: (urlCount + optionCount) > mergedCount ? 'yes' : 'no'
			});
		}
	}

	/**
	 * Log query string serialization
	 */
	static logQueryStringSerialization(context, params, queryString) {
		if (!context?.req?.verbose) return;
		
		const paramCount = params ? Object.keys(params).length : 0;
		
		if (paramCount > 0) {
			verboseLog(context, 'URL', `Serialized query string: ${queryString}`, {
				params: paramCount,
				queryString: queryString,
				length: queryString.length
			});
		}
	}

	/**
	 * Log final URL construction
	 */
	static logFinalUrl(context, finalUrl, components) {
		if (!context?.req?.verbose) return;
		
		verboseLog(context, 'URL', `Final URL constructed: ${finalUrl}`, {
			url: finalUrl,
			protocol: components.protocol,
			host: components.host,
			pathname: components.pathname,
			search: components.search ? `?${components.search}` : 'none',
			length: finalUrl.length
		});
	}

	/**
	 * Log URL validation
	 */
	static logUrlValidation(context, url, isValid, issues = []) {
		if (!context?.req?.verbose) return;
		
		verboseLog(context, 'URL', `URL validation: ${isValid ? 'valid' : 'invalid'}`, {
			url: url,
			valid: isValid,
			issues: issues.length > 0 ? issues : 'none',
			length: url.length
		});
	}

	/**
	 * Log URL parsing
	 */
	static logUrlParsing(context, url, parsedComponents) {
		if (!context?.req?.verbose) return;
		
		verboseLog(context, 'URL', `Parsed URL components`, {
			original: url,
			protocol: parsedComponents.protocol,
			hostname: parsedComponents.hostname,
			port: parsedComponents.port || 'default',
			pathname: parsedComponents.pathname,
			search: parsedComponents.search || 'none',
			hash: parsedComponents.hash || 'none'
		});
	}

	/**
	 * Log URL transformation
	 */
	static logUrlTransformation(context, fromUrl, toUrl, transformation) {
		if (!context?.req?.verbose) return;
		
		verboseLog(context, 'URL', `URL transformation: ${transformation}`, {
			from: fromUrl,
			to: toUrl,
			transformation: transformation,
			changed: fromUrl !== toUrl
		});
	}

	/**
	 * Log URL encoding/decoding
	 */
	static logUrlEncoding(context, original, encoded, operation) {
		if (!context?.req?.verbose) return;
		
		if (original !== encoded) {
			verboseLog(context, 'URL', `URL ${operation}: ${original} → ${encoded}`, {
				original: original,
				result: encoded,
				operation: operation, // 'encode', 'decode'
				changed: true
			});
		}
	}
}

// Convenience functions for direct usage
export function logUrlCombination(context, baseUrl, relativePath, finalUrl) {
	UrlVerboseLogger.logUrlCombination(context, baseUrl, relativePath, finalUrl);
}

export function logQueryParameterMerging(context, urlParams, optionParams, mergedParams) {
	UrlVerboseLogger.logQueryParameterMerging(context, urlParams, optionParams, mergedParams);
}

export function logFinalUrl(context, finalUrl, components) {
	UrlVerboseLogger.logFinalUrl(context, finalUrl, components);
}

export function logUrlValidation(context, url, isValid, issues) {
	UrlVerboseLogger.logUrlValidation(context, url, isValid, issues);
}