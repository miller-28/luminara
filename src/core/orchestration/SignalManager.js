import { verboseLog } from '../verbose/verboseLogger.js';

/**
 * SignalManager - Manage AbortController signals
 * 
 * Responsibility: Combine user signals with internal signals
 */

export class SignalManager {
	
	/**
	 * Merge user's AbortController signal with context controller
	 */
	static mergeUserSignal(context, userSignal, statsEmitter) {
		if (!userSignal) {
			return;
		}
		
		const cleanup = () => {
			context.controller.abort();
			
			// Emit abort event
			if (statsEmitter) {
				statsEmitter.emit('request:abort', {
					id: context.meta.requestId
				});
			}
		};
		
		userSignal.addEventListener('abort', cleanup);
		
		// Log signal combination if verbose
		if (context.req.verbose) {
			verboseLog(context, 'REQUEST', 'Combined user abort signal with internal signal', {
				hasUserSignal: true,
				signalAborted: userSignal.aborted,
				combinedSignals: 'user + internal',
				requestId: context.meta.requestId
			});
		}
	}

}
