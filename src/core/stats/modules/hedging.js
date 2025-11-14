/**
 * Hedging module for tracking request hedging metrics
 */

import { Rolling60sWindow } from '../windows/rolling60s.js';
import { SinceResetWindow } from '../windows/sinceReset.js';
import { SinceStartWindow } from '../windows/sinceStart.js';

export class HedgingModule {
	
	constructor() {
		this.windows = {
			'rolling-60s': new Rolling60sWindow(),
			'since-reset': new SinceResetWindow(),
			'since-start': new SinceStartWindow()
		};
		
		// Track hedging statistics
		this.totalHedgedRequests = 0;
		this.successfulHedges = 0;
		this.totalHedgesSent = 0;
		this.cancelledRequests = 0;
		this.totalLatencySaved = 0;
		this.hedgesByPolicy = {
			'cancel-and-retry': 0,
			'race': 0
		};
	}

	/**
	 * Record successful hedging operation
	 */
	recordSuccess(metadata) {
		const { winner, totalAttempts, latencySaved, policy } = metadata;
		
		this.totalHedgedRequests++;
		this.totalHedgesSent += totalAttempts;
		
		// Track if hedge won (not primary)
		if (winner !== 'primary') {
			this.successfulHedges++;
			this.totalLatencySaved += latencySaved;
		}
		
		// Track cancelled requests
		this.cancelledRequests += (totalAttempts - 1);
		
		// Track by policy
		if (this.hedgesByPolicy[policy] !== undefined) {
			this.hedgesByPolicy[policy]++;
		}
		
		// Add to time windows
		const dataPoint = {
			type: 'hedging',
			winner,
			totalAttempts,
			latencySaved,
			policy,
			timestamp: Date.now()
		};
		
		Object.values(this.windows).forEach(window => window.add(dataPoint));
	}

	/**
	 * Record failed hedging operation
	 */
	recordFailure(metadata) {
		const { totalAttempts, policy } = metadata;
		
		this.totalHedgedRequests++;
		this.totalHedgesSent += totalAttempts;
		this.cancelledRequests += totalAttempts;
		
		// Track by policy
		if (this.hedgesByPolicy[policy] !== undefined) {
			this.hedgesByPolicy[policy]++;
		}
		
		// Add to time windows
		const dataPoint = {
			type: 'hedging-failure',
			totalAttempts,
			policy,
			timestamp: Date.now()
		};
		
		Object.values(this.windows).forEach(window => window.add(dataPoint));
	}

	/**
	 * Get hedging statistics
	 */
	get(window = 'since-start') {
		const windowData = this.windows[window];
		if (!windowData) {
			return null;
		}
		
		const dataPoints = windowData.getData();
		
		// Calculate aggregated stats from data points
		let hedgedRequests = 0;
		let hedgeWins = 0;
		let hedgesSent = 0;
		let cancelled = 0;
		let totalLatency = 0;
		const policyBreakdown = {
			'cancel-and-retry': 0,
			'race': 0
		};
		
		dataPoints.forEach(point => {
			if (point.type === 'hedging') {
				hedgedRequests++;
				hedgesSent += point.totalAttempts;
				cancelled += (point.totalAttempts - 1);
				
				if (point.winner !== 'primary') {
					hedgeWins++;
					totalLatency += point.latencySaved;
				}
				
				if (policyBreakdown[point.policy] !== undefined) {
					policyBreakdown[point.policy]++;
				}
			} else if (point.type === 'hedging-failure') {
				hedgedRequests++;
				hedgesSent += point.totalAttempts;
				cancelled += point.totalAttempts;
				
				if (policyBreakdown[point.policy] !== undefined) {
					policyBreakdown[point.policy]++;
				}
			}
		});
		
		return {
			totalHedgedRequests: hedgedRequests,
			hedgeSuccessRate: hedgedRequests > 0 ? hedgeWins / hedgedRequests : 0,
			avgLatencyImprovement: hedgeWins > 0 ? Math.floor(totalLatency / hedgeWins) : 0,
			totalHedgesSent: hedgesSent,
			cancelledRequests: cancelled,
			hedgesByPolicy: policyBreakdown
		};
	}

	/**
	 * Reset module statistics
	 */
	reset() {
		this.totalHedgedRequests = 0;
		this.successfulHedges = 0;
		this.totalHedgesSent = 0;
		this.cancelledRequests = 0;
		this.totalLatencySaved = 0;
		this.hedgesByPolicy = {
			'cancel-and-retry': 0,
			'race': 0
		};
		
		// Reset windows
		Object.values(this.windows).forEach(window => {
			if (window.reset) {
				window.reset();
			}
		});
	}
}
