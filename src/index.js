import { LuminaraClient } from "./core/luminara.js";
import { OfetchDriver } from "./drivers/ofetch.js";

// Simple factory that creates a default client (uses OfetchDriver)
export function createLuminara(config = {}) {
	const driver = OfetchDriver(config);
	return new LuminaraClient(driver);
}

// Re-export client, driver, and types for users that need custom setups
export { LuminaraClient } from "./core/luminara.js";
export { OfetchDriver } from "./drivers/ofetch.js";
export { backoffStrategies, createBackoffHandler } from "./core/backoff.js";
