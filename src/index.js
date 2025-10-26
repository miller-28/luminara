import { OfetchDriver } from "./drivers/ofetch.js";
import { LuminaraClient } from "./core/luminara.js";

export function createLuminara() {
  const driver = OfetchDriver();
  return new LuminaraClient(driver);
}

// Re-exports for users extending Luminara
export { LuminaraClient } from "./core/luminara.js";