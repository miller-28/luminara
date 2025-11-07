import { statsLogger } from './verboseLogger.js';

/**
 * StatsEventEmitter - Emit stats events to StatsHub
 * 
 * Responsibility: Manage stats event emission and logging
 */

export class StatsEventEmitter {
	
	constructor(config, statsInstance) {
		this.config = config;
		this.statsInstance = statsInstance;
		this.enabled = config.statsEnabled !== false;
	}
	
	/**
	 * Emit a stats event
	 */
	emit(eventType, data) {

		// Early return if stats are disabled
		if (!this.enabled) {
			return;
		}
		
		// Log the stats event if verbose is enabled
		if (this.config.verbose) {
			statsLogger.logRequestLifecycle({ req: { verbose: true } }, eventType, data);
		}
		
		try {
			switch (eventType) {
				case 'request:start':
					this.statsInstance.onRequestStart(data);
					break;
				case 'request:success':
					this.statsInstance.onRequestSuccess(data);
					break;
				case 'request:fail':
					this.statsInstance.onRequestFail(data);
					break;
				case 'request:retry':
					this.statsInstance.onRequestRetry(data);
					break;
				case 'request:abort':
					this.statsInstance.onRequestAbort(data);
					break;
			}
		} catch (error) {

			// Don't let stats errors break the main request flow
			console.warn('Stats event error:', error);
			
			// Log stats system error if verbose is enabled
			if (this.config.verbose) {
				statsLogger.log({ req: { verbose: true } }, 'SYSTEM', 'Stats listener error', {
					error,
					listener: eventType
				});
			}
		}
	}
	
	/**
	 * Enable stats collection
	 */
	enable() {
		this.enabled = true;
		
		if (this.config.verbose) {
			statsLogger.log({ req: { verbose: true } }, 'SYSTEM', 'Stats enabled', {
				runtime: true
			});
		}
	}
	
	/**
	 * Disable stats collection
	 */
	disable() {
		this.enabled = false;
		
		if (this.config.verbose) {
			statsLogger.log({ req: { verbose: true } }, 'SYSTEM', 'Stats disabled', {
				runtime: true
			});
		}
	}
	
	/**
	 * Check if stats are enabled
	 */
	isEnabled() {
		return this.enabled;
	}

}
