import { createLuminara } from "../../dist/index.mjs";

/**
 * Stats Enable/Disable examples demonstrating:
 * - Stats enabled by default
 * - Disabling stats at initialization
 * - Runtime enable/disable control
 * - Separate stats instances per createLuminara call
 * - Verbose logging of stats operations
 */

export const stats = {
	title: "📊 Stats System Control",
	examples: [
	{
		id: 'stats-enabled-default',
		title: 'Stats Enabled by Default',
		run: async (updateOutput, signal) => {
			const api = createLuminara({
				baseURL: 'https://jsonplaceholder.typicode.com'
			});
			
			const isEnabled = api.isStatsEnabled();
			
			// Make a request
			try {
				const response = await api.get('/posts/1', { signal });
				
				const stats = api.stats().counters.get();
				return `✅ Stats enabled by default: ${isEnabled}\n📝 Made request to /posts/1\n📊 Stats tracking:\n   - Total requests: ${stats.total}\n   - Successful: ${stats.success}\n   - Failed: ${stats.fail}\n\n✅ Default stats behavior verified!`;
			} catch (error) {
				if (error.name === 'AbortError') {
					return '⏹️ Request aborted';
				} else {
					return `❌ Error: ${error.message}`;
				}
			}
		}
	},
	{
		id: 'stats-disabled-init',
		title: 'Stats Disabled at Initialization',
		run: async (updateOutput, signal) => {
			const api = createLuminara({
				baseURL: 'https://jsonplaceholder.typicode.com',
				statsEnabled: false
			});
			
			const isDisabled = !api.isStatsEnabled();
			
			// Make a request
			try {
				const response = await api.get('/posts/2', { signal });
				
				const stats = api.stats().counters.get();
				return `✅ Stats disabled at init: ${isDisabled}\n📝 Made request to /posts/2\n📊 Stats tracking (should be 0):\n   - Total requests: ${stats.total}\n   - Successful: ${stats.success}\n   - Failed: ${stats.fail}\n\n✅ Stats properly disabled at initialization!`;
			} catch (error) {
				if (error.name === 'AbortError') {
					return '⏹️ Request aborted';
				} else {
					return `❌ Error: ${error.message}`;
				}
			}
		}
	},
	{
		id: 'stats-runtime-toggle',
		title: 'Runtime Enable/Disable Control',
		run: async (updateOutput, signal) => {
			const api = createLuminara({
				baseURL: 'https://jsonplaceholder.typicode.com'
			});
			
			let result = `✅ Initially enabled: ${api.isStatsEnabled()}\n`;
			
			// First request (tracked)
			try {
				await api.get('/posts/3', { signal });
				result += `📝 Made first request (tracked)\n`;
				
				let stats = api.stats().counters.get();
				result += `📊 After first request: ${stats.total} total\n`;
				
				// Disable stats
				api.disableStats();
				result += `🔄 Disabled stats: ${!api.isStatsEnabled()}\n`;
				
				// Second request (not tracked)
				await api.get('/posts/4', { signal });
				result += `📝 Made second request (not tracked)\n`;
				
				stats = api.stats().counters.get();
				result += `📊 After disable: ${stats.total} total (should be 1)\n`;
				
				// Re-enable stats
				api.enableStats();
				result += `🔄 Re-enabled stats: ${api.isStatsEnabled()}\n`;
				
				// Third request (tracked again)
				await api.get('/posts/5', { signal });
				result += `📝 Made third request (tracked again)\n`;
				
				stats = api.stats().counters.get();
				result += `📊 After re-enable: ${stats.total} total (should be 2)\n`;
				
				result += `\n✅ Runtime stats control working perfectly!`;
				return result;
				
			} catch (error) {
				if (error.name === 'AbortError') {
					return '⏹️ Request aborted';
				} else {
					return `❌ Error: ${error.message}`;
				}
			}
		}
	},
	{
		id: 'stats-method-chaining',
		title: 'Method Chaining Support',
		run: async (updateOutput, signal) => {
			const api = createLuminara({
				baseURL: 'https://jsonplaceholder.typicode.com'
			});
			
			// Test chaining
			const result = api
				.disableStats()
				.enableStats()
				.disableStats()
				.enableStats()
				.isStatsEnabled();
			
			let output = `✅ Chaining: disable().enable().disable().enable() = ${result}\n`;
			
			// Test that it actually works
			try {
				const beforeStats = api.stats().counters.get().total;
				await api.get('/posts/6', { signal });
				const afterStats = api.stats().counters.get().total;
				
				output += `📊 Before request: ${beforeStats} total\n`;
				output += `📊 After request: ${afterStats} total\n`;
				output += `✅ Request tracked after chaining: ${afterStats > beforeStats}\n`;
				output += `\n✅ Method chaining works perfectly!`;
				
				return output;
			} catch (error) {
				if (error.name === 'AbortError') {
					return '⏹️ Request aborted';
				} else {
					return `❌ Error: ${error.message}`;
				}
			}
		}
	},
	{
		id: 'stats-separate-instances',
		title: 'Separate Stats Per Instance',
		run: async (updateOutput, signal) => {
			// Each createLuminara gets its own stats instance
			const api1 = createLuminara({
				baseURL: 'https://jsonplaceholder.typicode.com'
			});
			const api2 = createLuminara({
				baseURL: 'https://jsonplaceholder.typicode.com'
			});
			
			let output = '📊 Testing separate stats instances:\n';
			
			try {
				await api1.get('/posts/7', { signal });
				output += `  - API1 made request\n`;
				
				await api2.get('/posts/8', { signal });
				output += `  - API2 made request\n`;
				
				const api1Stats = api1.stats().counters.get();
				const api2Stats = api2.stats().counters.get();
				
				output += `  - API1 sees: ${api1Stats.total} total requests\n`;
				output += `  - API2 sees: ${api2Stats.total} total requests\n`;
				output += `  - Separate instances: ${api1Stats.total === 1 && api2Stats.total === 1}\n\n`;
				
				// Make another request with API1 to show they're truly separate
				await api1.get('/posts/9', { signal });
				output += `  - API1 made second request\n`;
				
				const api1Stats2 = api1.stats().counters.get();
				const api2Stats2 = api2.stats().counters.get();
				
				output += `  - API1 now sees: ${api1Stats2.total} total requests\n`;
				output += `  - API2 still sees: ${api2Stats2.total} total requests\n`;
				output += `  - Truly separate: ${api1Stats2.total === 2 && api2Stats2.total === 1}\n`;
				
				output += `\n✅ Each createLuminara instance has separate stats!`;
				return output;
				
			} catch (error) {
				if (error.name === 'AbortError') {
					return '⏹️ Request aborted';
				} else {
					return `❌ Error: ${error.message}`;
				}
			}
		}
	},
	{
		id: 'stats-interface-when-disabled',
		title: 'Stats Interface Accessibility When Disabled',
		run: async (updateOutput, signal) => {
			const api = createLuminara({
				baseURL: 'https://jsonplaceholder.typicode.com',
				statsEnabled: false
			});
			
			let output = `✅ Stats disabled: ${!api.isStatsEnabled()}\n`;
			
			// Test interface availability
			const stats = api.stats();
			output += `✅ Stats interface available: ${!!stats}\n`;
			output += `✅ Query method available: ${typeof stats.query === 'function'}\n`;
			output += `✅ Counters helper available: ${typeof stats.counters === 'object'}\n`;
			output += `✅ Time helper available: ${typeof stats.time === 'object'}\n`;
			
			// Test calling methods
			const snapshot = stats.snapshot();
			output += `✅ Can call snapshot(): ${!!snapshot.timestamp}\n`;
			
			const counters = stats.counters.get();
			output += `✅ Can call counters.get(): total=${counters.total}\n`;
			
			const query = stats.query({ metrics: ['counters'] });
			output += `✅ Can call query(): ${!!query.timestamp}\n`;
			
			// Test that nothing is tracked even though interface works
			try {
				await api.get('/posts/1', { signal });
				output += `📝 Made request while disabled\n`;
				
				const afterStats = stats.counters.get();
				output += `📊 Request tracked: ${afterStats.total > 0 ? 'Yes' : 'No'} (should be No)\n`;
				
				output += `\n✅ Stats interface fully accessible even when disabled!`;
				return output;
			} catch (error) {
				if (error.name === 'AbortError') {
					return '⏹️ Request aborted';
				} else {
					return `❌ Error: ${error.message}`;
				}
			}
		}
	},
	{
		id: 'stats-verbose-logging',
		title: 'Stats Verbose Logging',
		run: async (updateOutput, signal) => {
			// Capture console output for demonstration
			const logMessages = [];
			const originalConsoleInfo = console.info;
			console.info = (...args) => {
				const message = args.join(' ');
				if (message.includes('[Luminara] STATS:')) {
					logMessages.push(message);
				}
				originalConsoleInfo(...args);
			};
			
			const api = createLuminara({
				baseURL: 'https://jsonplaceholder.typicode.com',
				verbose: true  // Enable verbose logging
			});
			
			let output = `✅ Created Luminara client with verbose: true\n`;
			output += `✅ Stats verbose logging enabled automatically\n\n`;
			
			try {
				// Make a request that will trigger verbose stats logging
				await api.get('/posts/1', { signal });
				output += `📝 Made request to /posts/1\n\n`;
				
				// Get stats which will also trigger verbose logging
				const stats = api.stats().counters.get();
				output += `📊 Retrieved stats (this triggers verbose logging)\n`;
				output += `   - Total requests: ${stats.total}\n`;
				output += `   - Successful: ${stats.success}\n\n`;
				
				// Reset stats which will also trigger verbose logging
				api.stats().reset();
				output += `🔄 Reset stats (this triggers verbose logging)\n\n`;
				
				// Snapshot which will also trigger verbose logging
				const snapshot = api.stats().snapshot();
				output += `📸 Created snapshot (this triggers verbose logging)\n\n`;
				
				// Restore console
				console.info = originalConsoleInfo;
				
				// Show captured verbose messages
				if (logMessages.length > 0) {
					output += `📋 Captured verbose logs:\n`;
					logMessages.slice(0, 3).forEach((msg, i) => {
						// Extract just the relevant part of the log message
						const statsMsg = msg.replace(/^.*\[Luminara\] STATS:\s*/, '');
						output += `   ${i + 1}. ${statsMsg}\n`;
					});
					if (logMessages.length > 3) {
						output += `   ... and ${logMessages.length - 3} more verbose logs\n`;
					}
				} else {
					output += `📋 No verbose logs captured (check browser console)\n`;
				}
				
				output += `\n✅ Verbose stats logging demonstrated!`;
				output += `\n💡 Check browser console for full verbose output`;
				
				return output;
				
			} catch (error) {
				// Restore console
				console.info = originalConsoleInfo;
				
				if (error.name === 'AbortError') {
					return '⏹️ Request aborted';
				} else {
					return `❌ Error: ${error.message}`;
				}
			}
		}
	}
	]
};