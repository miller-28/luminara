import { createLuminara, LuminaraClient } from "../../src/index.js";

export const customDriver = {
	title: "🚗 Custom Driver",
	tests: [
		{
			id: "browser-driver",
			title: "Browser Fetch Driver",
			run: async (updateOutput, signal) => {
				const BrowserDriver = () => ({
					async request(options) {
						const { url, method = 'GET', headers, body, signal } = options;
						const response = await fetch(url, { method, headers, body, signal });
						const contentType = response.headers.get('content-type') || '';
						const isJson = contentType.includes('application/json');
						const data = isJson ? await response.json() : await response.text();
						return { status: response.status, headers: response.headers, data };
					}
				});

				const client = new LuminaraClient(BrowserDriver());
				const response = await client.getJson('https://jsonplaceholder.typicode.com/todos/1', { signal });
				return `Custom Driver: Native Fetch\nStatus: ${response.status}\nTodo Title: ${response.data.title}\n\n✅ Using custom driver instead of ofetch`;
			}
		}
	]
};
