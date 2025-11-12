import { logRequest, logError, verboseLog } from '../verbose/verboseLogger.js';

/**
 * RetryOrchestrator - Manage retry logic and backoff
 * 
 * Responsibility: Execute retry loops with policy decisions
 */

export class RetryOrchestrator {
	
	constructor(driver, statsEmitter) {
		this.driver = driver;
		this.statsEmitter = statsEmitter;
	}
	
	/**
	 * Execute request with retry logic
	 */
	async execute(context, pluginPipeline) {
		const maxAttempts = context.req.retry ? context.req.retry + 1 : 1;
		const timings = context.__timings;
		
		// Log initial request start
		logRequest(context, 'start');
		
		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			context.attempt = attempt;
			context.error = null;
			context.res = null;
			
			// Log each attempt
			logRequest(context, 'attempt');
			
			try {

				// On retry, re-run request interceptors for fresh tokens/headers
				if (attempt > 1) {
					context.req = { ...context.req }; // Fresh copy for retry
				}
				
				// 1) onRequest interceptors
				if (timings) timings.pluginOnRequestStart = performance.now();
				await pluginPipeline.executeOnRequest(context);
				if (timings) timings.pluginOnRequest = performance.now() - timings.pluginOnRequestStart;
				
				// 2) Execute driver request
				if (timings) timings.driverRequestStart = performance.now();
				context.res = await this.driver.request(context.req);
				if (timings) timings.driverRequest = performance.now() - timings.driverRequestStart;
				
				// 3) onResponse interceptors
				if (timings) timings.pluginOnResponseStart = performance.now();
				await pluginPipeline.executeOnResponse(context);
				if (timings) timings.pluginOnResponse = performance.now() - timings.pluginOnResponseStart;
				
				// Success - log completion and emit stats event
				const duration = Date.now() - context.meta.requestStartTime;
				
				// Emit stats event for success
				this.statsEmitter.emit('request:success', {
					id: context.meta.requestId,
					status: context.res?.status || 200,
					durationMs: duration
				});
				
				logRequest(context, 'complete', {
					duration,
					status: context.res?.status || 200,
					attempt: context.attempt,
					retries: context.attempt - 1,
					responseType: typeof context.res?.data,
					url: context.req.url,
					method: context.req.method || 'GET',
					requestId: context.meta.requestId
				});
				
				// Log additional response details if verbose
				if (context.req.verbose) {
					verboseLog(context, 'RESPONSE', 'Request completed successfully', {
						finalAttempt: context.attempt,
						totalRetries: context.attempt - 1,
						responseStatus: context.res?.status,
						responseSize: context.res?.data ? (typeof context.res.data === 'string' ? context.res.data.length : 'object') : 'none',
						totalDuration: `${duration}ms`,
						successful: true,
						requestId: context.meta.requestId
					});
				}
				
				return context.res;
			} catch (error) {
				context.error = error;
				
				// Log error details
				logError(context, 'caught', {
					type: error.name || 'Error',
					message: error.message,
					status: error.status,
					retryable: attempt < maxAttempts && this.shouldRetry(error, context)
				});
				
				// 4) onResponseError interceptors
				await pluginPipeline.executeOnResponseError(context);
				
				// Check if we should retry
				if (attempt < maxAttempts && this.shouldRetry(error, context)) {

					// Apply retry delay
					const delay = await this.getRetryDelay(context);
					
					// Emit retry stats event
					this.statsEmitter.emit('request:retry', {
						id: context.meta.requestId,
						attempt: attempt + 1,
						backoffMs: delay
					});
					
					if (delay > 0) {
						await new Promise(resolve => setTimeout(resolve, delay));
					}
					continue; // Retry
				}
				
				// No more retries - emit failure stats event and log final error
				const duration = Date.now() - context.meta.requestStartTime;
				this.statsEmitter.emit('request:fail', {
					id: context.meta.requestId,
					status: error.status,
					errorKind: this.classifyError(error),
					durationMs: duration
				});
				
				logError(context, 'final', {
					message: context.error.message,
					requestId: context.meta.requestId
				});
				throw context.error;
			}
		}
	}
	
	/**
	 * Determine if request should be retried
	 */
	shouldRetry(error, context) {

		// Use driver's retry logic for sophisticated policy decisions
		if (this.driver.shouldRetry) {
			return this.driver.shouldRetry(error, context);
		}
		
		// Fallback to simple retry logic
		// Check custom retry status codes first
		if (context.req.retryStatusCodes && Array.isArray(context.req.retryStatusCodes) && error.status) {
			return context.req.retryStatusCodes.includes(error.status);
		}
		
		// Default retry logic for server errors (5xx) and specific client errors
		if (error.status) {

			// Server errors (5xx) - generally retryable
			if (error.status >= 500) {
				return true;
			}
			
			// Auth errors (401) - retryable for auth refresh scenarios
			if (error.status === 401) {
				return true;
			}
			
			// Request timeout (408) - retryable
			if (error.status === 408) {
				return true;
			}
			
			// Too many requests (429) - retryable with backoff
			if (error.status === 429) {
				return true;
			}
		}
		
		// Network errors without status (connection issues) - retryable
		if (!error.status) {
			return true;
		}
		
		return false;
	}
	
	/**
	 * Get retry delay duration
	 */
	async getRetryDelay(context) {

		// Use driver's retry delay calculation if available
		if (this.driver.calculateRetryDelay) {
			return await this.driver.calculateRetryDelay(context);
		}
		
		// Fallback to simple retry delay logic
		const { req } = context;
		if (typeof req.retryDelay === 'function') {
			return req.retryDelay(context);
		}
		
		return req.retryDelay || 1000;
	}
	
	/**
	 * Classify error for stats tracking
	 */
	classifyError(error) {
		if (error.name === 'AbortError' || error.message?.includes('abort')) {
			return 'aborted';
		}
		if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
			return 'timeout';
		}
		if (!error.status) {
			return 'network';
		}
		
		return 'http';
	}

}
