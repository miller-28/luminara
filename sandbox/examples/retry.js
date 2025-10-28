import { createLuminara } from "../../src/index.js";

export const retry = {
	title: "🔄 Retry Logic",
	tests: [
		{
			id: "retry-basic",
			title: "Basic Retry (3 attempts)",
			run: async (updateOutput, signal) => {
				const client = createLuminara();
				const retryLog = [];
				
				const originalConsoleLog = console.log;
				console.log = (...args) => {
					const message = args.join(' ');
					if (message.includes('[Luminara') || message.includes('Retry')) {
						retryLog.push(message);
						if (updateOutput) {
							updateOutput(`Retry Count: 3\nDelay: 500ms\nEndpoint: /status/503\n\n📊 Retry Log:\nInitial attempt...\n${retryLog.join('\n')}\n\n⏳ In progress...`);
						}
					}
					originalConsoleLog(...args);
				};

				try {
					await client.get('https://httpbingo.org/status/503', {
						retry: 3,
						retryDelay: 500,
						signal
					});
				} catch (error) {
					console.log = originalConsoleLog;
					if (error.name === 'AbortError') throw error;
					return `Retry Count: 3\nDelay: 500ms\nEndpoint: /status/503\n\n📊 Retry Log:\nInitial attempt failed\n${retryLog.join('\n')}\n\n⚠️ Failed after all retries (expected)`;
				} finally {
					console.log = originalConsoleLog;
				}
			}
		},
		{
			id: "retry-status-codes",
			title: "Retry with Status Codes",
			run: async (updateOutput, signal) => {
				const client = createLuminara();
				const retryLog = [];
				
				const originalConsoleLog = console.log;
				console.log = (...args) => {
					const message = args.join(' ');
					if (message.includes('[Luminara') || message.includes('Retry')) {
						retryLog.push(message);
						if (updateOutput) {
							updateOutput(`Retry Count: 2\nRetry on: [408, 429, 500, 502, 503]\nEndpoint: /status/429\n\n📊 Retry Log:\n${retryLog.join('\n')}\n\n⏳ In progress...`);
						}
					}
					originalConsoleLog(...args);
				};

				try {
					await client.get('https://httpbingo.org/status/429', {
						retry: 2,
						retryDelay: 300,
						retryStatusCodes: [408, 429, 500, 502, 503],
						signal
					});
				} catch (error) {
					console.log = originalConsoleLog;
					if (error.name === 'AbortError') throw error;
					return `Retry Count: 2\nRetry on: [408, 429, 500, 502, 503]\nEndpoint: /status/429\n\n📊 Retry Log:\n${retryLog.join('\n')}\n\n⚠️ Status 429 triggered retries (expected)`;
				} finally {
					console.log = originalConsoleLog;
				}
			}
		}
	]
};
