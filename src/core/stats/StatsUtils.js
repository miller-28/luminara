/**
 * StatsUtils - Stats utility functions
 * 
 * Responsibility: Provide stats-related utility methods
 */

export class StatsUtils {
	
	/**
	 * Extract domain from URL
	 */
	static extractDomain(url) {
		if (!url) {
			return 'unknown';
		}
		
		try {
			if (url.startsWith('http://') || url.startsWith('https://')) {
				return new URL(url).hostname;
			} else {

				// Relative URL - use window.location if available (browser)
				if (typeof window !== 'undefined' && window.location) {
					return window.location.hostname;
				}
				
				return 'localhost';
			}
		} catch {
			return 'unknown';
		}
	}
	
	/**
	 * Normalize endpoint for stats tracking
	 */
	static normalizeEndpoint(method, url) {
		if (!url) {
			return 'unknown';
		}
		
		try {
			const urlObj = url.startsWith('http') ? new URL(url) : { pathname: url };
			let path = urlObj.pathname || url;
			
			// Replace common ID patterns with :id
			const idPatterns = [
				/\/\d+(?=\/|$)/g, // Numeric IDs
				/\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}(?=\/|$)/g, // UUIDs
				/\/[a-f0-9]{24}(?=\/|$)/g, // MongoDB ObjectIds
				/\/[a-zA-Z0-9\-_]{8,}(?=\/|$)/g // Long alphanumeric strings
			];
			
			for (const pattern of idPatterns) {
				path = path.replace(pattern, '/:id');
			}
			
			return `${method} ${path}`;
		} catch {
			return `${method} unknown`;
		}
	}

}
