import { createLuminara } from '../../dist/index.mjs';

export const backoffStrategies = {
	title: '📈 Backoff Strategies',
	examples: [
		{
			id: 'backoff-linear',
			title: 'Linear Backoff',
			code: `import { createLuminara } from 'luminara';

const client = createLuminara();

try {
  await client.get('https://api.example.com/status/503', {
    retry: 6,
    retryDelay: 300,
    backoffType: 'linear'
  });
} catch (error) {
  console.log('Linear backoff: 300ms constant delay between retries');
}`,
			run: async (updateOutput, signal, options = {}) => {
				const client = createLuminara({ verbose: options.verbose || false });
				const startTime = Date.now();

				try {
					await client.get('https://httpbingo.org/status/503', {
						retry: 6,
						retryDelay: 300,
						backoffType: 'linear',
						signal
					});
				} catch (error) {
					const totalTime = Date.now() - startTime;

					return `Strategy: Linear Backoff\nExpected: 300ms constant delay\nRetries: 6\n\nTotal Time: ${totalTime}ms\n\n✅ All retries completed\n\n💡 Linear backoff maintains consistent 300ms delays between attempts.\n\n🔍 Check browser console for detailed timing logs.`;
				}
			}
		},
		{
			id: 'backoff-exponential',
			title: 'Exponential Backoff',
			code: `import { createLuminara } from 'luminara';

const client = createLuminara();

try {
  await client.get('https://api.example.com/status/500', {
    retry: 5,
    retryDelay: 200,
    backoffType: 'exponential'
  });
} catch (error) {
  // Delays: 200ms, 400ms, 800ms, 1600ms, 3200ms
  console.log('Exponential backoff: Doubles delay with each retry');
}`,
			run: async (updateOutput, signal, options = {}) => {
				const client = createLuminara({ verbose: options.verbose || false });
				const startTime = Date.now();

				try {
					await client.get('https://httpbingo.org/status/500', {
						retry: 5,
						retryDelay: 200,
						backoffType: 'exponential',
						signal
					});
				} catch (error) {
					const totalTime = Date.now() - startTime;

					return `Strategy: Exponential Backoff\nBase: 200ms, Growth: 2^n\nRetries: 5\n\nTotal Time: ${totalTime}ms\n\n✅ All retries completed\n\n🔍 Expected delays:\n• Attempt 1: 0ms (initial)\n• Attempt 2: 200ms (2^0×200)\n• Attempt 3: 400ms (2^1×200)\n• Attempt 4: 800ms (2^2×200)\n• Attempt 5: 1600ms (2^3×200)\n• Attempt 6: 3200ms (2^4×200)\n\n💡 Exponential backoff doubles the delay with each retry.\n\n🔍 Check browser console for detailed timing logs.`;
				}
			}
		},
		{
			id: 'backoff-exponential-capped',
			title: 'Exponential Capped',
			code: `import { createLuminara } from 'luminara';

const client = createLuminara();

try {
  await client.get('https://api.example.com/status/500', {
    retry: 5,
    retryDelay: 200,
    backoffType: 'exponential',
    backoffMaxDelay: 1000  // Cap delay at 1000ms
  });
} catch (error) {
  // Delays: 200ms, 400ms, 800ms, 1000ms (capped), 1000ms (capped)
  console.log('Exponential backoff capped at 1000ms maximum');
}`,
			run: async (updateOutput, signal, options = {}) => {
				const client = createLuminara({ verbose: options.verbose || false });
				const startTime = Date.now();

				try {
					await client.get('https://httpbingo.org/status/500', {
						retry: 5,
						retryDelay: 300,
						backoffType: 'exponentialCapped',
						backoffMaxDelay: 3000,
						signal
					});
				} catch (error) {
					const totalTime = Date.now() - startTime;

					return `Strategy: Exponential Capped\nBase: 300ms, Max: 3000ms\nRetries: 5\n\nTotal Time: ${totalTime}ms\n\n✅ All retries completed\n\n🔍 Expected delays:\n• Attempt 1: 0ms (initial)\n• Attempt 2: 600ms (2¹×300)\n• Attempt 3: 1200ms (2²×300)\n• Attempt 4: 2400ms (2³×300)\n• Attempt 5: 3000ms (capped at max)\n• Attempt 6: 3000ms (capped at max)\n\n💡 Exponential capped prevents delays from growing beyond the maximum.\n\n🔍 Check browser console for detailed timing logs.`;
				}
			}
		},
		{
			id: 'backoff-fibonacci',
			title: 'Fibonacci Backoff',
			code: `import { createLuminara } from 'luminara';

const client = createLuminara();

try {
  await client.get('https://api.example.com/status/503', {
    retry: 8,
    retryDelay: 200,
    backoffType: 'fibonacci'
  });
} catch (error) {
  // Delays follow Fibonacci: 200ms, 200ms, 400ms, 600ms, 1000ms, 1600ms, 2600ms...
  console.log('Fibonacci backoff: Gradual increase following Fibonacci sequence');
}`,
			run: async (updateOutput, signal, options = {}) => {
				const client = createLuminara({ verbose: options.verbose || false });
				const startTime = Date.now();

				try {
					await client.get('https://httpbingo.org/status/503', {
						retry: 8,
						retryDelay: 200,
						backoffType: 'fibonacci',
						signal
					});
				} catch (error) {
					const totalTime = Date.now() - startTime;

					return `Strategy: Fibonacci Backoff\nBase: 200ms, Sequence: 1,1,2,3,5,8,13...\nRetries: 8\n\nTotal Time: ${totalTime}ms\n\n✅ All retries completed\n\n🔍 Expected delays:\n• Attempt 1: 0ms (initial)\n• Attempt 2: 200ms (1×200)\n• Attempt 3: 200ms (1×200)\n• Attempt 4: 400ms (2×200)\n• Attempt 5: 600ms (3×200)\n• Attempt 6: 1000ms (5×200)\n• Attempt 7: 1600ms (8×200)\n• Attempt 8: 2600ms (13×200)\n\n💡 Fibonacci backoff follows the Fibonacci sequence for gradual increase.\n\n🔍 Check browser console for detailed timing logs.`;
				}
			}
		},
		{
			id: 'backoff-jitter',
			title: 'Jitter Backoff',
			code: `import { createLuminara } from 'luminara';

const client = createLuminara();

try {
  await client.get('https://api.example.com/status/503', {
    retry: 3,
    retryDelay: 500,
    backoffType: 'jitter'
  });
} catch (error) {
  // Adds random jitter to prevent thundering herd: 500-1000ms per retry
  console.log('Jitter backoff: Random delays prevent simultaneous retries');
}`,
			run: async (updateOutput, signal, options = {}) => {
				const client = createLuminara({ verbose: options.verbose || false });
				const startTime = Date.now();

				try {
					await client.get('https://httpbingo.org/status/503', {
						retry: 3,
						retryDelay: 500,
						backoffType: 'jitter',
						signal
					});
				} catch (error) {
					const totalTime = Date.now() - startTime;

					return `Strategy: Jitter Backoff\nBase: 500ms + random jitter\nRetries: 3\n\nTotal Time: ${totalTime}ms\n\n✅ All retries completed\n\n🔍 Expected delays:\n• Attempt 1: 0ms (initial)\n• Attempt 2: 500-1000ms (base + random)\n• Attempt 3: 500-1000ms (base + random)\n• Attempt 4: 500-1000ms (base + random)\n\n💡 Jitter adds randomness to prevent thundering herd patterns.\n\n🔍 Check browser console for detailed timing logs.`;
				}
			}
		},
		{
			id: 'backoff-exponential-jitter',
			title: 'Exponential Jitter',
			code: `import { createLuminara } from 'luminara';

const client = createLuminara();

try {
  await client.get('https://api.example.com/status/503', {
    retry: 4,
    retryDelay: 300,
    backoffType: 'exponentialJitter',
    backoffMaxDelay: 5000
  });
} catch (error) {
  // Combines exponential growth with jitter for optimal retry pattern
  console.log('Exponential jitter: Best of both strategies');
}`,
			run: async (updateOutput, signal, options = {}) => {
				const client = createLuminara({ verbose: options.verbose || false });
				const startTime = Date.now();

				try {
					await client.get('https://httpbingo.org/status/503', {
						retry: 4,
						retryDelay: 300,
						backoffType: 'exponentialJitter',
						backoffMaxDelay: 5000,
						signal
					});
				} catch (error) {
					const totalTime = Date.now() - startTime;

					return `Strategy: Exponential Jitter\nBase: 300ms, Growth: 2^n + jitter\nMax: 5000ms\nRetries: 4\n\nTotal Time: ${totalTime}ms\n\n✅ All retries completed\n\n🔍 Expected delays:\n• Attempt 1: 0ms (initial)\n• Attempt 2: 600-900ms (2¹×300 + jitter)\n• Attempt 3: 1200-1500ms (2²×300 + jitter)\n• Attempt 4: 2400-2700ms (2³×300 + jitter)\n• Attempt 5: 4800-5100ms (2⁴×300 + jitter, capped)\n\n💡 Exponential jitter combines exponential growth with randomization.\n\n🔍 Check browser console for detailed timing logs.`;
				}
			}
		},
		{
			id: 'backoff-initial-delay',
			title: 'Initial Delay Example',
			code: `import { createLuminara } from 'luminara';

const client = createLuminara();

try {
  await client.get('https://api.example.com/status/503', {
    retry: 3,
    retryDelay: 500,
    backoffType: 'linear',
    initialDelay: 2000  // Wait 2 seconds before first retry
  });
} catch (error) {
  // Delays: 2000ms (initial), 500ms, 500ms
  console.log('Initial delay ensures pause before first retry');
}`,
			run: async (updateOutput, signal, options = {}) => {
				const client = createLuminara({ verbose: options.verbose || false });
				const startTime = Date.now();

				try {

					// Initial delay example
					await client.get('https://httpbingo.org/status/503', {
						retry: 3,
						retryDelay: 500,
						backoffType: 'linear', 
						initialDelay: 2000,  // Wait 2s before first retry
						signal
					});
				} catch (error) {
					const totalTime = Date.now() - startTime;

					return `Initial Delay Example\n\nConfiguration:\n• retry: 3\n• retryDelay: 500ms\n• backoffType: 'linear'\n• initialDelay: 2000ms\n\nTotal Time: ${totalTime}ms\n\n✅ All retries completed\n\n🔍 Expected delays:\n• Attempt 1: 0ms (initial request)\n• Attempt 2: 2000ms (initial delay)\n• Attempt 3: 500ms (linear)\n• Attempt 4: 500ms (linear)\n\n💡 Initial delay allows setting a specific delay before the first retry.\n\n🔍 Check browser console for detailed timing logs.`;
				}
			}
		},
		{
			id: 'backoff-custom-array',
			title: 'Custom Array Example', 
			code: `import { createLuminara } from 'luminara';

const client = createLuminara();

try {
  await client.get('https://api.example.com/status/503', {
    retry: 5,
    backoffType: 'custom',
    backoffDelays: [800, 5000, 10000, 15000, 30000]
  });
} catch (error) {
  // Uses exact delays from array: 800ms, 5s, 10s, 15s, 30s
  console.log('Custom array: Precise control over retry delays');
}`,
			run: async (updateOutput, signal, options = {}) => {
				const client = createLuminara({ verbose: options.verbose || false });
				const startTime = Date.now();

				try {

					// Custom array example  
					await client.get('https://httpbingo.org/status/503', {
						retry: 5,
						backoffType: 'custom',
						backoffDelays: [800, 5000, 10000, 15000, 30000],
						signal
					});
				} catch (error) {
					const totalTime = Date.now() - startTime;

					return `Custom Array Example\n\nConfiguration:\n• retry: 5\n• backoffType: 'custom'\n• backoffDelays: [800, 5000, 10000, 15000, 30000]\n\nTotal Time: ${totalTime}ms\n\n✅ All retries completed\n\n🔍 Expected delays:\n• Attempt 1: 0ms (initial request)\n• Attempt 2: 800ms (array[0])\n• Attempt 3: 5000ms (array[1])\n• Attempt 4: 10000ms (array[2])\n• Attempt 5: 15000ms (array[3])\n• Attempt 6: 30000ms (array[4])\n\n💡 Custom arrays provide precise control over retry timing.\n\n🔍 Check browser console for detailed timing logs.`;
				}
			}
		},
		{
			id: 'backoff-combined-features',
			title: 'Combined Features Example',
			code: `import { createLuminara } from 'luminara';

const client = createLuminara();

try {
  await client.get('https://api.example.com/status/503', {
    retry: 4,
    retryDelay: 400,
    backoffType: 'exponentialJitter',
    backoffMaxDelay: 3000,
    initialDelay: 1000
  });
} catch (error) {
  // Combines: initial delay, exponential jitter, max cap
  console.log('All backoff features working together');
}`,
			run: async (updateOutput, signal, options = {}) => {
				const client = createLuminara({ verbose: options.verbose || false });
				const startTime = Date.now();

				try {

					// Combined features
					await client.get('https://httpbingo.org/status/503', {
						retry: 4,
						backoffType: 'custom',
						backoffDelays: [3000, 5000, 10000],
						initialDelay: 1500,  // 1.5s initial, then custom array
						signal
					});
				} catch (error) {
					const totalTime = Date.now() - startTime;

					return `Combined Features Example\n\nConfiguration:\n• retry: 4\n• backoffType: 'custom'\n• backoffDelays: [3000, 5000, 10000]\n• initialDelay: 1500ms\n\nTotal Time: ${totalTime}ms\n\n✅ All retries completed\n\n🔍 Expected delays:\n• Attempt 1: 0ms (initial request)\n• Attempt 2: 1500ms (initial delay)\n• Attempt 3: 5000ms (array[1] - skips array[0])\n• Attempt 4: 10000ms (array[2])\n• Attempt 5: 10000ms (last value repeated)\n\n💡 Combines initial delay with custom array for maximum flexibility.\n\n🔍 Check browser console for detailed timing logs.`;
				}
			}
		}
	]
};
