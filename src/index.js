import { LuminaraClient } from "./core/luminara.js";
import { NativeFetchDriver } from "./drivers/native/index.js";
import { OfetchDriver } from "./drivers/ofetch/index.js";

// Simple factory that creates a default client (uses NativeFetchDriver)
export function createLuminara(config = {}) {
	const driver = NativeFetchDriver(config);
	return new LuminaraClient(driver, [], config);  // Pass config to client too
}

// Re-export client, drivers, and utilities for users that need custom setups
export { LuminaraClient } from "./core/luminara.js";
export { NativeFetchDriver } from "./drivers/native/index.js";
export { OfetchDriver } from "./drivers/ofetch/index.js"; // Optional driver for users who prefer ofetch
export { backoffStrategies, createBackoffHandler } from "./core/backoff.js";
