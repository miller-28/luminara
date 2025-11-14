/**
 * Request Hedging Feature - Main Entry Point
 * 
 * Hedging is a latency optimization technique that sends redundant requests
 * when the primary request appears stuck or slow.
 * 
 * Key principles:
 * - Only triggers on SLOW requests (not errors)
 * - Errors are handled by retry feature
 * - Default: OFF (opt-in)
 * - Whitelist approach for HTTP methods (safe/idempotent only)
 */

import { HedgingCoordinator } from './HedgingCoordinator.js';
import * as hedgingLogger from './verboseLogger.js';

/**
 * Check if hedging should be used for this request
 * 
 * Logic:
 * 1. If hedging config provided at request level with enabled:false → disabled
 * 2. If hedging config provided (global or request level) → enabled (implicit)
 * 3. If no hedging config at all → disabled
 * 
 * This allows:
 * - Global hedging enabled, per-request disable: hedging: { enabled: false }
 * - Global hedging disabled, per-request enable: hedging: { policy: 'race', ... }
 * 
 * @param {object} preparedRequest - Prepared request object
 * @returns {boolean} True if hedging should be applied
 */
export function shouldUseHedging(preparedRequest) {
	const { hedging, method } = preparedRequest;
	
	// No hedging config → disabled
	if (!hedging) {
		return false;
	}
	
	// Explicitly disabled → respect that (allows per-request override)
	if (hedging.enabled === false) {
		return false;
	}
	
	// If hedging config exists and not explicitly disabled → enabled
	// This supports both scenarios:
	// 1. Global config provided, per-request can disable with enabled:false
	// 2. No global config, per-request can enable by providing config
	
	// Get included methods (whitelist)
	let includedMethods = hedging.includeHttpMethods || ['GET', 'HEAD', 'OPTIONS'];
	
	// Support single string format: 'GET' -> ['GET']
	if (typeof includedMethods === 'string') {
		includedMethods = [includedMethods];
	}
	
	// Normalize to uppercase
	includedMethods = includedMethods.map(m => m.toUpperCase());
	
	// Method must be explicitly allowed
	if (!includedMethods.includes(method.toUpperCase())) {
		if (preparedRequest.verbose) {
			hedgingLogger.logHedgingDisabled(`method ${method} not in whitelist [${includedMethods.join(', ')}]`);
		}
		return false;
	}
	
	// Validate configuration
	const validationErrors = validateHedgingConfig(hedging);
	if (validationErrors.length > 0) {
		if (preparedRequest.verbose) {
			hedgingLogger.logConfigValidationError(validationErrors);
		}
		return false;
	}
	
	return true;
}

/**
 * Execute request with hedging
 * 
 * @param {object} preparedRequest - Prepared request object
 * @param {number} currentAttempt - Current attempt number
 * @param {Function} driverExecuteFn - Driver's execute function for actual request
 * @returns {Promise<Response>} Response with hedging metadata
 */
export async function executeWithHedging(preparedRequest, currentAttempt, driverExecuteFn) {
	const coordinator = new HedgingCoordinator(preparedRequest, currentAttempt, driverExecuteFn);
	return await coordinator.execute();
}

/**
 * Validate hedging configuration
 * 
 * @param {object} config - Hedging configuration
 * @returns {string[]} Array of validation error messages (empty if valid)
 */
export function validateHedgingConfig(config) {
	const errors = [];
	
	// Validate policy
	const validPolicies = ['cancel-and-retry', 'race'];
	if (config.policy && !validPolicies.includes(config.policy)) {
		errors.push(`policy must be one of: ${validPolicies.join(', ')}`);
	}
	
	// Validate hedgeDelay
	if (config.hedgeDelay !== undefined) {
		if (typeof config.hedgeDelay !== 'number' || config.hedgeDelay < 0) {
			errors.push('hedgeDelay must be a positive number');
		}
	}
	
	// Validate maxHedges
	if (config.maxHedges !== undefined) {
		if (typeof config.maxHedges !== 'number' || config.maxHedges < 0) {
			errors.push('maxHedges must be a non-negative number');
		}
	}
	
	// Validate backoffMultiplier
	if (config.backoffMultiplier !== undefined) {
		if (typeof config.backoffMultiplier !== 'number' || config.backoffMultiplier < 1) {
			errors.push('backoffMultiplier must be >= 1');
		}
	}
	
	// Validate jitterRange
	if (config.jitterRange !== undefined) {
		if (typeof config.jitterRange !== 'number' || config.jitterRange < 0 || config.jitterRange > 1) {
			errors.push('jitterRange must be between 0 and 1');
		}
	}
	
	// Validate includeHttpMethods
	if (config.includeHttpMethods !== undefined) {
		const methods = Array.isArray(config.includeHttpMethods) 
			? config.includeHttpMethods 
			: [config.includeHttpMethods];
		
		const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
		const invalidMethods = methods.filter(m => 
			!validMethods.includes(m.toUpperCase()));
		
		if (invalidMethods.length > 0) {
			errors.push(`Invalid HTTP methods: ${invalidMethods.join(', ')}`);
		}
	}
	
	return errors;
}

/**
 * Create a HedgingError
 */
export function createHedgingError(message, attempts, policy, totalAttempts) {
	const error = new Error(message);
	error.name = 'HedgingError';
	error.attempts = attempts;
	error.policy = policy;
	error.totalAttempts = totalAttempts;
	return error;
}

/**
 * Type guard for HedgingError
 */
export function isHedgingError(error) {
	return error && error.name === 'HedgingError';
}

/**
 * Type guard for hedging metadata
 */
export function hasHedgingMetadata(response) {
	return response && 
		typeof response === 'object' && 
		'hedgingMetadata' in response &&
		response.hedgingMetadata !== null &&
		typeof response.hedgingMetadata === 'object';
}
