/**
 * ContextBuilder - Build request context objects
 * 
 * Responsibility: Create and initialize request context with metadata
 */

let requestIdCounter = 0;

export class ContextBuilder {
	
	/**
	 * Build a request context object
	 */
	static build(mergedReq, driver) {
		const requestId = this.generateRequestId();
		
		return {
			req: { ...mergedReq },
			res: null,
			error: null,
			attempt: 1,
			controller: new AbortController(),
			meta: {
				requestStartTime: Date.now(),
				requestId
			}
		};
	}
	
	/**
	 * Generate unique request ID
	 */
	static generateRequestId() {
		return `req_${++requestIdCounter}_${Date.now()}`;
	}
	
	/**
	 * Reset request ID counter (useful for testing)
	 */
	static resetCounter() {
		requestIdCounter = 0;
	}

}
