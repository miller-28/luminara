/**
 * URL feature verbose logger
 * Handles detailed logging for URL building, base URL resolution, and query parameter processing
 */

import { BaseVerboseLogger } from '../../../../core/verbose/BaseVerboseLogger.js';

export class UrlVerboseLogger extends BaseVerboseLogger {
	
	constructor() {
		super('URL');
	}

	/**
	 * Log URL building start
	 */
	logUrlBuildingStart(context, baseUrl, providedUrl) {
		this.log(context, 'BUILD_START', 'Starting URL construction', {
			base: baseUrl || 'none',
			provided: providedUrl,
			hasBase: !!baseUrl
		});
	}

	/**
	 * Log base URL resolution
	 */
	logBaseUrlResolution(context, baseUrl, source) {
		this.config(context, {
			baseUrl: baseUrl,
			source: source
		}, `Base URL resolved from ${source}: ${baseUrl}`);
	}

	/**
	 * Log URL combination process
	 */
	logUrlCombination(context, baseUrl, path, finalUrl) {
		this.log(context, 'COMBINATION', `URL combined: ${baseUrl} + ${path} = ${finalUrl}`, {
			base: baseUrl,
			path: path,
			final: finalUrl,
			isAbsolute: path?.startsWith('http')
		});
	}

	/**
	 * Log query parameter processing
	 */
	logQueryParameterProcessing(context, queryParams, processedQuery) {
		this.debug(context, 'QUERY', 'Query parameters processed', {
			original: queryParams,
			processed: processedQuery,
			paramCount: Object.keys(queryParams || {}).length
		});
	}

	/**
	 * Log final URL construction
	 */
	logFinalUrlConstruction(context, finalUrl, components) {
		this.log(context, 'FINAL', `Final URL constructed: ${finalUrl}`, {
			url: finalUrl,
			protocol: components.protocol,
			host: components.host,
			pathname: components.pathname,
			search: components.search
		});
	}

	/**
	 * Log URL validation
	 */
	logUrlValidation(context, url, isValid, validationError) {
		if (isValid) {
			this.debug(context, 'VALIDATION', `URL validation passed: ${url}`, {
				url: url,
				valid: true
			});
		} else {
			this.error(context, 'VALIDATION', `URL validation failed: ${validationError}`, {
				url: url,
				valid: false,
				error: validationError
			});
		}
	}
}

// Create singleton instance
const urlLogger = new UrlVerboseLogger();

export { urlLogger };
