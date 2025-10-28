import { createLuminara } from "../../src/index.js";

export const timeout = {
	title: "⏱️ Timeout",
	tests: [
		{
			id: "timeout-success",
			title: "Timeout Success (2s delay, 5s timeout)",
			run: async (updateOutput, signal) => {
				const client = createLuminara();
				
				if (updateOutput) {
					updateOutput(`Status: Pending\nTimeout: 5000ms\nDelay: 2s\n\n⏳ Waiting for response...\n\nThe server will delay 2 seconds.\nRequest will timeout after 5 seconds.`);
				}
				
				const timeoutResponse = await client.get('https://httpbingo.org/delay/2', {
					timeout: 5000,
					signal
				});
				
				return `Status: ${timeoutResponse.status}\nTimeout: 5000ms\nDelay: 2s\n\n✅ Request completed successfully\n\nThe request completed before the timeout.`;
			}
		},
		{
			id: "timeout-fail",
			title: "Timeout Failure (3s delay, 1s timeout)",
			run: async (updateOutput, signal) => {
				const client = createLuminara();
				
				if (updateOutput) {
					updateOutput(`Status: Pending\nTimeout: 1000ms\nDelay: 3s\n\n⏳ Waiting for response...\n\nThe server will delay 3 seconds.\nRequest will timeout after 1 second.`);
				}
				
				try {
					await client.get('https://httpbingo.org/delay/3', {
						timeout: 1000,
						signal
					});
				} catch (error) {
					return `Timeout: 1000ms\nDelay: 3s\n\n⚠️ Expected timeout error:\n${error.message}\n\nThe request timed out before the server responded.`;
				}
			}
		}
	]
};
