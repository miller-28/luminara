import { createLuminara, LuminaraClient } from "../../dist/index.mjs";

export const customDriver = {
	title: "🚗 Custom Driver",
    examples: [
		{
			id: "browser-driver",
			title: "Browser Fetch Driver",
			run: async (updateOutput, signal, options = {}) => {
				// Define a custom driver factory function
				const BrowserDriver = (config = {}) => {
					return {
						async request(options) {
							const { url, method = 'GET', headers, body, signal } = options;
							
							updateOutput(`🌐 Custom Driver: Making ${method} request to ${url}`);
							
							const response = await fetch(url, { method, headers, body, signal });
							const contentType = response.headers.get('content-type') || '';
							const isJson = contentType.includes('application/json');
							const data = isJson ? await response.json() : await response.text();
							
							updateOutput(`✅ Custom Driver: Response received with status ${response.status}`);
							
							return { 
								status: response.status, 
								headers: response.headers, 
								data 
							};
						}
					};
				};

				const client = new LuminaraClient(
					BrowserDriver(),  // Driver as first parameter
					[],               // Plugins as second parameter
					{ verbose: options.verbose || false }  // Config as third parameter
				);
				
				const response = await client.getJson('https://jsonplaceholder.typicode.com/todos/1', { signal });
				return `Custom Driver: Native Fetch\nStatus: ${response.status}\nTodo Title: ${response.data.title}\n\n✅ Using custom driver instead of default OfetchDriver`;
			}
		}
    ]
};
