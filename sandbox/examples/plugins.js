import { createLuminara } from "../../dist/index.mjs";

export const plugins = {
	title: "🔌 Plugin System",
	tests: [
		{
			id: "plugin-request",
			title: "Request Interceptor",
			run: async (updateOutput, signal) => {
				const client = createLuminara();
				let interceptorLog = [];
				
				client.use({
					onRequest(request) {
						interceptorLog.push(`🔵 Intercepted: ${request.method} ${request.url}`);
						request.headers = { ...(request.headers || {}), 'X-Custom-Header': 'Luminara' };
						return request;
					}
				});

				const response = await client.get('https://httpbingo.org/get', { signal });
				return `${interceptorLog.join('\n')}\n\n✅ Custom header added\nStatus: ${response.status}`;
			}
		},
		{
			id: "plugin-response",
			title: "Response Transformer",
			run: async (updateOutput, signal) => {
				const client = createLuminara();
				let transformLog = [];

				client.use({
					onSuccess(response) {
						transformLog.push('🟢 Response received, transforming...');
						response.data.transformed = true;
						response.data.timestamp = new Date().toISOString();
						return response;
					}
				});

				const response = await client.getJson('https://jsonplaceholder.typicode.com/todos/1', { signal });
				return `${transformLog.join('\n')}\n\nOriginal todo ID: ${response.data.id}\nTransformed: ${response.data.transformed}\nTimestamp: ${response.data.timestamp}`;
			}
		},
		{
			id: "plugin-error",
			title: "Error Handler",
			run: async (updateOutput, signal) => {
				const client = createLuminara();
				let errorLog = [];

				client.use({
					onError(error, request) {
						errorLog.push(`🔴 Error caught in plugin`);
						errorLog.push(`Request: ${request.method} ${request.url}`);
						errorLog.push(`Error: ${error.message}`);
					}
				});

				try {
					await client.get('https://httpbingo.org/status/500', { signal });
				} catch (error) {
					return errorLog.join('\n') + '\n\n⚠️ Error logged by plugin';
				}
			}
		}
	]
};
