/**
 * Selectors for filtering and extracting dimensions from data points
 */

/**
 * Extract domain from a data point
 */
export const selectDomain = (dataPoint) => {
	return dataPoint.domain || "unknown";
};

/**
 * Extract method from a data point
 */
export const selectMethod = (dataPoint) => {
	return dataPoint.method || "unknown";
};

/**
 * Extract endpoint from a data point
 */
export const selectEndpoint = (dataPoint) => {
	return dataPoint.endpoint || "unknown";
};

/**
 * Extract tag from a data point (returns first tag or "no-tags")
 */
export const selectTag = (dataPoint) => {
	const tags = dataPoint.tags || [];
	return tags.length > 0 ? tags[0] : "no-tags";
};

/**
 * Create a filter function based on where criteria
 */
export const createFilterFunction = (where = {}) => {
	return (dataPoint) => {
		// If no where criteria, accept all
		if (!where || Object.keys(where).length === 0) {
			return true;
		}
		
		// Check domain filter
		if (where.domain && selectDomain(dataPoint) !== where.domain) {
			return false;
		}
		
		// Check method filter
		if (where.method && selectMethod(dataPoint) !== where.method) {
			return false;
		}
		
		// Check endpoint prefix filter
		if (where.endpointPrefix) {
			const endpoint = selectEndpoint(dataPoint);
			if (!endpoint.startsWith(where.endpointPrefix)) {
				return false;
			}
		}
		
		// Check tag filter (any tag must match)
		if (where.tag) {
			const tags = dataPoint.tags || [];
			if (!tags.includes(where.tag)) {
				return false;
			}
		}
		
		return true;
	};
};

/**
 * Create a groupBy function that returns the group key for a data point
 */
export const createGroupByFunction = (groupBy) => {
	switch (groupBy) {
		case "domain":
			return selectDomain;
		case "method":
			return selectMethod;
		case "endpoint":
			return selectEndpoint;
		case "tag":
			return selectTag;
		case "none":
		default:
			return () => "all";
	}
};

/**
 * Group data points by the specified dimension
 */
export const groupDataPoints = (dataPoints, groupBy) => {
	const groupByFn = createGroupByFunction(groupBy);
	const groups = new Map();
	
	for (const dataPoint of dataPoints) {
		const groupKey = groupByFn(dataPoint);
		
		if (!groups.has(groupKey)) {
			groups.set(groupKey, []);
		}
		
		groups.get(groupKey).push(dataPoint);
	}
	
	return groups;
};

/**
 * Apply limit to grouped results
 */
export const applyLimit = (groupedResults, limit) => {
	if (!limit || limit <= 0) {
		return groupedResults;
	}
	
	// Sort by group key for consistent ordering
	const sorted = groupedResults.sort((a, b) => a.key.localeCompare(b.key));
	return sorted.slice(0, limit);
};

/**
 * Normalize endpoint path by replacing IDs with templates
 * Examples:
 * - "/users/123" -> "/users/:id"
 * - "/api/v1/orders/abc-def-123/items" -> "/api/v1/orders/:id/items"
 */
export const normalizeEndpoint = (method, path) => {
	if (!path) return "unknown";
	
	// Common ID patterns to replace with :id
	const idPatterns = [
		/\/\d+(?=\/|$)/g, // Numeric IDs: /123
		/\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}(?=\/|$)/g, // UUIDs
		/\/[a-f0-9]{24}(?=\/|$)/g, // MongoDB ObjectIds
		/\/[a-zA-Z0-9\-_]{8,}(?=\/|$)/g // Long alphanumeric strings
	];
	
	let normalizedPath = path;
	
	for (const pattern of idPatterns) {
		normalizedPath = normalizedPath.replace(pattern, '/:id');
	}
	
	// Combine method and normalized path
	return `${method || 'UNKNOWN'} ${normalizedPath}`;
};

/**
 * Extract request metadata from various event types
 */
export const extractRequestMetadata = (event) => {
	const metadata = {
		domain: event.domain || null,
		method: event.method || null,
		endpoint: event.endpoint || null,
		tags: event.tags || []
	};
	
	// If we have a URL but no domain, try to extract it
	if (!metadata.domain && event.url) {
		try {
			const url = new URL(event.url);
			metadata.domain = url.hostname;
		} catch {
			// Invalid URL, keep domain as null
		}
	}
	
	// If we have method and path but no endpoint, normalize it
	if (!metadata.endpoint && metadata.method && event.path) {
		metadata.endpoint = normalizeEndpoint(metadata.method, event.path);
	}
	
	return metadata;
};

/**
 * Check if a group key matches a where filter
 */
export const groupKeyMatchesFilter = (groupKey, groupBy, where) => {
	if (!where || Object.keys(where).length === 0) {
		return true;
	}
	
	switch (groupBy) {
		case "domain":
			return !where.domain || groupKey === where.domain;
		case "method":
			return !where.method || groupKey === where.method;
		case "endpoint":
			return !where.endpointPrefix || groupKey.includes(where.endpointPrefix);
		case "tag":
			return !where.tag || groupKey === where.tag;
		default:
			return true;
	}
};