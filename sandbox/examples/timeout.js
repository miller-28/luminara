import { createLuminara } from '../../dist/index.mjs';

export const timeout = {
	title: '⏱️ Timeout',
	examples: [
		{
			id: 'timeout-success',
			title: 'Timeout Success (2s delay, 5s timeout)',
			code: `import { createLuminara } from 'luminara';

const client = createLuminara();

// Request will complete within timeout
const response = await client.get('https://api.example.com/slow', {
  timeout: 5000  // 5 second timeout
});

console.log('Request completed:', response.status);`,
			run: async (updateOutput, signal, options = {}) => {
				const client = createLuminara({ verbose: options.verbose || false });
				
				if (updateOutput) {
					updateOutput('Status: Pending\nTimeout: 5000ms\nDelay: 2s\n\n⏳ Waiting for response...\n\nThe server will delay 2 seconds.\nRequest will timeout after 5 seconds.');
				}
				
				const timeoutResponse = await client.get('https://httpbingo.org/delay/2', {
					timeout: 5000,
					signal
				});
				
				return `Status: ${timeoutResponse.status}\nTimeout: 5000ms\nDelay: 2s\n\n✅ Request completed successfully\n\nThe request completed before the timeout.`;
			}
		},
		{
			id: 'timeout-fail',
			title: 'Timeout Failure (3s delay, 1s timeout)',
			code: `import { createLuminara } from 'luminara';

const client = createLuminara();

try {
  // Request will timeout
  await client.get('https://api.example.com/very-slow', {
    timeout: 1000  // 1 second timeout
  });
} catch (error) {
  console.log('Timeout error:', error.message);
  // Error: Request timeout after 1000ms
}`,
			run: async (updateOutput, signal, options = {}) => {
				const client = createLuminara({ verbose: options.verbose || false });
				
				if (updateOutput) {
					updateOutput('Status: Pending\nTimeout: 1000ms\nDelay: 3s\n\n⏳ Waiting for response...\n\nThe server will delay 3 seconds.\nRequest will timeout after 1 second.');
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
