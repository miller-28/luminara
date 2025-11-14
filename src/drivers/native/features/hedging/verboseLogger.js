/**
 * Hedging-specific verbose logging
 */

const HEDGING_PREFIX = '[HEDGING]';

export function logHedgingEnabled(method, url, policy, hedgeDelay, maxHedges) {
	console.log(`${HEDGING_PREFIX} Request hedging enabled for ${method} ${url}`);
	console.log(`${HEDGING_PREFIX} Policy: ${policy} | Delay: ${hedgeDelay}ms | Max Hedges: ${maxHedges}`);
}

export function logPrimaryRequestSent(timestamp) {
	console.log(`${HEDGING_PREFIX} Primary request sent at T+${timestamp}ms`);
}

export function logHedgeTriggered(hedgeNumber, timestamp, pendingCount) {
	console.log(`${HEDGING_PREFIX} Hedge #${hedgeNumber} triggered at T+${timestamp}ms (${pendingCount} requests pending)`);
}

export function logHedgeWinner(winner, timestamp, latencySaved) {
	console.log(`${HEDGING_PREFIX} ${winner} won race at T+${timestamp}ms (saved ${latencySaved}ms)`);
}

export function logCancellingRequests(count) {
	console.log(`${HEDGING_PREFIX} Cancelling ${count} pending requests`);
}

export function logAllRequestsFailed(totalAttempts, errors) {
	console.log(`${HEDGING_PREFIX} All requests failed after ${totalAttempts} attempts`);
	errors.forEach(({ type, error }) => {
		console.log(`${HEDGING_PREFIX} ${type}: ${error}`);
	});
}

export function logHedgeWithBackoff(hedgeNumber, delay, timestamp) {
	console.log(`${HEDGING_PREFIX} Hedge #${hedgeNumber} scheduled with ${delay}ms backoff at T+${timestamp}ms`);
}

export function logServerRotation(hedgeNumber, serverUrl) {
	console.log(`${HEDGING_PREFIX} Hedge #${hedgeNumber} targeting server: ${serverUrl}`);
}

export function logPrimaryCancelled(timestamp) {
	console.log(`${HEDGING_PREFIX} Primary request cancelled at T+${timestamp}ms`);
}

export function logHedgingDisabled(reason) {
	console.log(`${HEDGING_PREFIX} Hedging disabled: ${reason}`);
}

export function logConfigValidationError(errors) {
	console.error(`${HEDGING_PREFIX} Configuration validation failed:`);
	errors.forEach(error => console.error(`${HEDGING_PREFIX}   - ${error}`));
}
