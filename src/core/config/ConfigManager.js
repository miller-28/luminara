import { verboseLog } from '../verbose/verboseLogger.js';
import { statsLogger } from '../stats/verboseLogger.js';
import { createRateLimitFeature } from '../../drivers/native/features/rateLimit/index.js';

/**
 * ConfigManager - Manage client configuration
 * 
 * Responsibility: Handle configuration merging and rate limiting
 */

export class ConfigManager {
	
	constructor(config) {
		this.config = config;
		this.rateLimitFeature = null;
		
		// Initialize rate limiting if configured
		if (config.rateLimit) {
			this.rateLimitFeature = createRateLimitFeature(config.rateLimit);
		}
	}
	
	/**
	 * Get current configuration
	 */
	get() {
		return this.config;
	}
	
	/**
	 * Merge request options with global config
	 */
	merge(req) {
		return { ...this.config, ...req };
	}
	
	/**
	 * Update configuration at runtime
	 */
	update(newConfig) {

		// Merge new config with existing
		this.config = { ...this.config, ...newConfig };
		
		// Handle rate limiting configuration updates
		if (newConfig.rateLimit !== undefined) {
			if (newConfig.rateLimit && this.rateLimitFeature) {

				// Update existing rate limiter
				this.rateLimitFeature.update(newConfig.rateLimit);
			} else if (newConfig.rateLimit && !this.rateLimitFeature) {

				// Enable rate limiting
				this.rateLimitFeature = createRateLimitFeature(newConfig.rateLimit);
			} else if (!newConfig.rateLimit && this.rateLimitFeature) {

				// Disable rate limiting
				this.rateLimitFeature.shutdown();
				this.rateLimitFeature = null;
			}
		}
		
		// Log configuration update if verbose
		if (this.config.verbose) {
			verboseLog(this.config, 'CONFIG', 'Client configuration updated', {
				rateLimitEnabled: !!this.rateLimitFeature,
				newConfigKeys: Object.keys(newConfig)
			});
		}
	}
	
	/**
	 * Apply rate limiting to a request
	 */
	async applyRateLimit(mergedReq) {
		if (this.rateLimitFeature) {
			await this.rateLimitFeature.schedule(mergedReq);
		}
	}
	
	/**
	 * Get rate limiting statistics
	 */
	getRateLimitStats() {
		return this.rateLimitFeature ? this.rateLimitFeature.stats.get() : null;
	}
	
	/**
	 * Reset rate limiting statistics
	 */
	resetRateLimitStats() {
		if (this.rateLimitFeature) {
			this.rateLimitFeature.stats.reset();
		}
	}
	
	/**
	 * Check if rate limiting is enabled
	 */
	hasRateLimit() {
		return !!this.rateLimitFeature;
	}
	
	/**
	 * Log configuration if verbose is enabled
	 */
	logConfiguration(driver, pluginCount) {
		if (this.config.verbose) {
			verboseLog(this.config, 'REQUEST', 'Luminara client configured', {
				driver: driver.constructor.name || 'unknown',
				plugins: pluginCount,
				hasGlobalConfig: Object.keys(this.config).length > 1,
				verboseEnabled: true,
				statsEnabled: this.config.statsEnabled !== false,
				rateLimitEnabled: !!this.rateLimitFeature
			});
			
			// Log stats system initialization
			if (this.config.verbose) {
				statsLogger.log({ req: { verbose: true } }, 'SYSTEM', 'Stats instance created', {
					type: 'instance',
					initialization: true
				});
			}
		}
	}

}
