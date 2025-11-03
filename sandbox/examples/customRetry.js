import { createLuminara } from "../../dist/index.mjs";

export const customRetry = {
	title: "⚙️ Custom Retry Handler",
    examples: [
		{
			id: "custom-on-retry",
			title: "Custom retryDelay Function",
			run: async (updateOutput, signal) => {
				const client = createLuminara();
				const retryLog = [];
				
				// Custom retryDelay function that logs each retry
				const customRetryDelay = (context) => {
					const retryAttempt = (context.options.retry || 0);
					const logMessage = `🔄 Retry attempt with custom 150ms delay (${retryAttempt} retries remaining)`;
					retryLog.push(logMessage);
					
					if (updateOutput) {
						updateOutput(`Custom retryDelay function:\n\n📊 Retry Log:\n${retryLog.join('\n')}\n\n⏳ In progress...\n\n💡 Using function instead of backoffType for full control`);
					}
					
					return 150; // Return delay in milliseconds
				};
				
				try {
					await client.get('https://httpbingo.org/status/503', {
						retry: 4,
						retryDelay: customRetryDelay,
						signal
					});
				} catch (error) {
					return `Custom retryDelay function:\n\n📊 Retry Log:\n${retryLog.join('\n')}\n\n✅ All retries completed\n\n💡 retryDelay can be a function for full control over retry timing`;
				}
			}
		}
    ]
};
