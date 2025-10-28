import { createLuminara } from "../../src/index.js";

export const backoffStrategies = {
	title: "📈 Backoff Strategies",
	tests: [
		{
			id: "backoff-linear",
			title: "Linear Backoff",
			run: async (updateOutput, signal) => {
				const client = createLuminara();
				const retryLog = [];
				
				const originalConsoleLog = console.log;
				console.log = (...args) => {
					const message = args.join(' ');
					if (message.includes('[Luminara')) {
						retryLog.push(message);
						if (updateOutput) {
							updateOutput(`Strategy: Linear\nDelay: 300ms each retry\nRetries: 6\n\n📊 Retry Log:\n${retryLog.join('\n')}\n\n⏳ In progress...`);
						}
					}
					originalConsoleLog(...args);
				};

				try {
					await client.get('https://httpbingo.org/status/503', {
						retry: 6,
						retryDelay: 300,
						backoffType: 'linear',
						signal
					});
				} catch (error) {
					console.log = originalConsoleLog;
					return `Strategy: Linear\nDelay: 300ms each retry\nRetries: 6\n\n📊 Retry Log:\n${retryLog.join('\n')}\n\n✅ All retries completed`;
				} finally {
					console.log = originalConsoleLog;
				}
			}
		},
		{
			id: "backoff-exponential",
			title: "Exponential Backoff",
			run: async (updateOutput, signal) => {
				const client = createLuminara();
				const retryLog = [];
				
				const originalConsoleLog = console.log;
				console.log = (...args) => {
					const message = args.join(' ');
					if (message.includes('[Luminara')) {
						retryLog.push(message);
						if (updateOutput) {
							updateOutput(`Strategy: Exponential\nBase Delay: 200ms\nGrowth: 2^n\n\n📊 Retry Log:\n${retryLog.join('\n')}\n\n⏳ In progress...`);
						}
					}
					originalConsoleLog(...args);
				};

				try {
					await client.get('https://httpbingo.org/status/503', {
						retry: 4,
						retryDelay: 200,
						backoffType: 'exponential',
						signal
					});
				} catch (error) {
					console.log = originalConsoleLog;
					return `Strategy: Exponential\nBase Delay: 200ms\nGrowth: 2^n\n\n📊 Retry Log:\n${retryLog.join('\n')}\n\n✅ All retries completed`;
				} finally {
					console.log = originalConsoleLog;
				}
			}
		},
		{
			id: "backoff-exponential-capped",
			title: "Exponential Capped",
			run: async (updateOutput, signal) => {
				const client = createLuminara();
				const retryLog = [];
				
				const originalConsoleLog = console.log;
				console.log = (...args) => {
					const message = args.join(' ');
					if (message.includes('[Luminara')) {
						retryLog.push(message);
						if (updateOutput) {
							updateOutput(`Strategy: Exponential Capped\nMax Delay: 3000ms\n\n📊 Retry Log:\n${retryLog.join('\n')}\n\n⏳ In progress...`);
						}
					}
					originalConsoleLog(...args);
				};

				try {
					await client.get('https://httpbingo.org/status/503', {
						retry: 5,
						retryDelay: 300,
						backoffType: 'exponentialCapped',
						backoffMaxDelay: 3000,
						signal
					});
				} catch (error) {
					console.log = originalConsoleLog;
					return `Strategy: Exponential Capped\nMax Delay: 3000ms\n\n📊 Retry Log:\n${retryLog.join('\n')}\n\n✅ All retries completed`;
				} finally {
					console.log = originalConsoleLog;
				}
			}
		},
		{
			id: "backoff-fibonacci",
			title: "Fibonacci Backoff",
			run: async (updateOutput, signal) => {
				const client = createLuminara();
				const retryLog = [];
				
				const originalConsoleLog = console.log;
				console.log = (...args) => {
					const message = args.join(' ');
					if (message.includes('[Luminara')) {
						retryLog.push(message);
						if (updateOutput) {
							updateOutput(`Strategy: Fibonacci\nSequence: 1, 1, 2, 3, 5, 8...\n\n📊 Retry Log:\n${retryLog.join('\n')}\n\n⏳ In progress...`);
						}
					}
					originalConsoleLog(...args);
				};

				try {
					await client.get('https://httpbingo.org/status/503', {
						retry: 8,
						retryDelay: 200,
						backoffType: 'fibonacci',
						signal
					});
				} catch (error) {
					console.log = originalConsoleLog;
					return `Strategy: Fibonacci\nSequence: 1, 1, 2, 3, 5, 8...\n\n📊 Retry Log:\n${retryLog.join('\n')}\n\n✅ All retries completed`;
				} finally {
					console.log = originalConsoleLog;
				}
			}
		},
		{
			id: "backoff-jitter",
			title: "Jitter Backoff",
			run: async (updateOutput, signal) => {
				const client = createLuminara();
				const retryLog = [];
				
				const originalConsoleLog = console.log;
				console.log = (...args) => {
					const message = args.join(' ');
					if (message.includes('[Luminara')) {
						retryLog.push(message);
						if (updateOutput) {
							updateOutput(`Strategy: Jitter\nRandomized delays to prevent thundering herd\n\n📊 Retry Log:\n${retryLog.join('\n')}\n\n⏳ In progress...`);
						}
					}
					originalConsoleLog(...args);
				};

				try {
					await client.get('https://httpbingo.org/status/503', {
						retry: 3,
						retryDelay: 500,
						backoffType: 'jitter',
						signal
					});
				} catch (error) {
					console.log = originalConsoleLog;
					return `Strategy: Jitter\nRandomized delays to prevent thundering herd\n\n📊 Retry Log:\n${retryLog.join('\n')}\n\n✅ All retries completed`;
				} finally {
					console.log = originalConsoleLog;
				}
			}
		},
		{
			id: "backoff-exponential-jitter",
			title: "Exponential Jitter",
			run: async (updateOutput, signal) => {
				const client = createLuminara();
				const retryLog = [];
				
				const originalConsoleLog = console.log;
				console.log = (...args) => {
					const message = args.join(' ');
					if (message.includes('[Luminara')) {
						retryLog.push(message);
						if (updateOutput) {
							updateOutput(`Strategy: Exponential + Jitter\nCombines exponential growth with randomization\n\n📊 Retry Log:\n${retryLog.join('\n')}\n\n⏳ In progress...`);
						}
					}
					originalConsoleLog(...args);
				};

				try {
					await client.get('https://httpbingo.org/status/503', {
						retry: 4,
						retryDelay: 300,
						backoffType: 'exponentialJitter',
						backoffMaxDelay: 5000,
						signal
					});
				} catch (error) {
					console.log = originalConsoleLog;
					return `Strategy: Exponential + Jitter\nCombines exponential growth with randomization\n\n📊 Retry Log:\n${retryLog.join('\n')}\n\n✅ All retries completed`;
				} finally {
					console.log = originalConsoleLog;
				}
			}
		}
	]
};
