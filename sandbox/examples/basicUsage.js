import { createLuminara } from "../../dist/index.mjs";

export const basicUsage = {
	title: "📦 Basic Usage",
	tests: [
		{
			id: "get-json",
			title: "GET JSON",
			run: async (updateOutput, signal) => {
				const client = createLuminara();
				const jsonResponse = await client.getJson('https://jsonplaceholder.typicode.com/todos/1', { signal });
				return `Status: ${jsonResponse.status}\nTodo ID: ${jsonResponse.data.id}\nTitle: ${jsonResponse.data.title}`;
			}
		},
		{
			id: "get-text",
			title: "GET Text",
			run: async (updateOutput, signal) => {
				const client = createLuminara();
				const textResponse = await client.getText('https://httpbingo.org/get', { signal });
				return `Status: ${textResponse.status}\nContent Length: ${String(textResponse.data).length} characters`;
			}
		},
		{
			id: "post-json",
			title: "POST JSON",
			run: async (updateOutput, signal) => {
				const client = createLuminara();
				const postResponse = await client.postJson('https://jsonplaceholder.typicode.com/posts', {
					title: 'Luminara Test',
					body: 'Testing POST request'
				}, { signal });
				return `Status: ${postResponse.status}\nCreated ID: ${postResponse.data.id}\nTitle: ${postResponse.data.title}`;
			}
		},
		{
			id: "post-form",
			title: "POST Form Data",
			run: async (updateOutput, signal) => {
				const client = createLuminara();
				const formResponse = await client.postForm('https://httpbingo.org/post', {
					hello: 'world',
					framework: 'luminara'
				}, { signal });
				return `Status: ${formResponse.status}\nForm Fields: ${Object.keys(formResponse.data.form || {}).join(', ')}`;
			}
		}
	]
};
