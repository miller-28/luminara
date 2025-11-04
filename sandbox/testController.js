// Test Controller - Handles test execution logic
import { basicUsage } from './examples/basicUsage.js';
import { baseUrlAndQuery } from './examples/baseUrlAndQuery.js';
import { timeout } from './examples/timeout.js';
import { retry } from './examples/retry.js';
import { backoffStrategies } from './examples/backoffStrategies.js';
import { interceptors } from './examples/interceptors.js';
import { customDriver } from './examples/customDriver.js';
import { responseTypes } from './examples/responseTypes.js';
import { errorHandling } from './examples/errorHandling.js';
import { verboseLogging } from './examples/verboseLogging.js';
import { stats } from './examples/stats.js';

// Aggregate all examples
export const examples = {
	basicUsage,
	baseUrlAndQuery,
	timeout,
	retry,
	backoffStrategies,
	interceptors,
	responseTypes,
	errorHandling,
	customDriver,
	verboseLogging,
	stats
};

// Test Controller Class
export class TestController {
	constructor() {
		this.abortControllers = new Map();
	}

	async runTest(testId, updateOutput, onStatusChange) {
		const test = this.findTest(testId);
		if (!test) return;

		// Create AbortController for this test
		const abortController = new AbortController();
		this.abortControllers.set(testId, abortController);

		// Notify UI of status change
		if (onStatusChange) {
			onStatusChange('running');
		}

		try {
			const result = await test.run(updateOutput, abortController.signal);
			
			// Check if it was aborted
			if (abortController.signal.aborted) {
				if (onStatusChange) {
					onStatusChange('stopped');
				}
				return { status: 'stopped', message: `${test.title} was stopped by user.` };
			} else {
				if (onStatusChange) {
					onStatusChange('success');
				}
				return { status: 'success', message: result };
			}
		} catch (error) {
			if (error.name === 'AbortError' || abortController.signal.aborted) {
				if (onStatusChange) {
					onStatusChange('stopped');
				}
				return { status: 'stopped', message: `${test.title} was stopped by user.` };
			} else {
				if (onStatusChange) {
					onStatusChange('error');
				}
				return { status: 'error', message: error.message, stack: error.stack };
			}
		} finally {
			this.abortControllers.delete(testId);
		}
	}

	stopTest(testId) {
		const abortController = this.abortControllers.get(testId);
		if (abortController) {
			abortController.abort();
		}
	}

	async runFeature(featureKey, runTestCallback) {
		const feature = examples[featureKey];
		if (!feature) return;

		const promises = feature.examples.map(test => runTestCallback(test.id));
		await Promise.all(promises);
	}

	async runAll(runTestCallback) {
		const allTests = [];
		for (const feature of Object.values(examples)) {
			for (const test of feature.examples) {
				allTests.push(runTestCallback(test.id));
			}
		}
		await Promise.all(allTests);
	}

	stopAll() {
		for (const [testId, abortController] of this.abortControllers) {
			abortController.abort();
		}
		this.abortControllers.clear();
	}

	findTest(testId) {
		for (const feature of Object.values(examples)) {
			const test = feature.examples.find(t => t.id === testId);
			if (test) return test;
		}
		return null;
	}
}
