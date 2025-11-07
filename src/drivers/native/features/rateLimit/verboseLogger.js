/**
 * Rate Limiting verbose logger
 * Handles detailed logging for rate limiting configuration, quota tracking, and throttling decisions
 */

import { BaseVerboseLogger } from '../../../../core/verbose/BaseVerboseLogger.js';

export class RateLimitVerboseLogger extends BaseVerboseLogger {
	
	constructor() {
		super('RATE_LIMIT');
	}

	/**
	 * Log rate limit configuration setup
	 */
	logRateLimitSetup(context, rateLimit, windowMs) {
		this.config(context, {
			maxRequests: rateLimit,
			windowMs: windowMs,
			strategy: 'sliding-window'
		}, `Rate limit configured: ${rateLimit} requests per ${windowMs}ms`);
	}

	/**
	 * Log rate limit check
	 */
	logRateLimitCheck(context, currentCount, maxRequests, remainingRequests) {
		this.debug(context, 'CHECK', `Rate limit check: ${currentCount}/${maxRequests} requests`, {
			current: currentCount,
			max: maxRequests,
			remaining: remainingRequests,
			utilization: `${Math.round((currentCount / maxRequests) * 100)}%`
		});
	}

	/**
	 * Log rate limit exceeded
	 */
	logRateLimitExceeded(context, currentCount, maxRequests, retryAfter) {
		this.error(context, 'EXCEEDED', `Rate limit exceeded: ${currentCount}/${maxRequests}`, {
			current: currentCount,
			max: maxRequests,
			exceeded: currentCount - maxRequests,
			retryAfter: retryAfter,
			action: 'throttled'
		});
	}

	/**
	 * Log rate limit window reset
	 */
	logRateLimitWindowReset(context, windowMs, newWindowStart) {
		this.log(context, 'WINDOW_RESET', 'Rate limit window reset', {
			windowMs: windowMs,
			newWindowStart: newWindowStart,
			resetReason: 'time-expired'
		});
	}

	/**
	 * Log throttling delay
	 */
	logThrottlingDelay(context, delayMs, reason) {
		this.timing(context, 'THROTTLE', delayMs, {
			delay: delayMs,
			reason: reason,
			action: 'delayed'
		});
	}

	/**
	 * Log rate limit quota update
	 */
	logQuotaUpdate(context, oldCount, newCount, operation) {
		this.debug(context, 'QUOTA', `Quota updated: ${oldCount} → ${newCount}`, {
			before: oldCount,
			after: newCount,
			operation: operation,
			delta: newCount - oldCount
		});
	}

}

// Create singleton instance
const rateLimitLogger = new RateLimitVerboseLogger();

export { rateLimitLogger };