import { createLuminara } from "../../dist/index.mjs";

export const baseUrlAndQuery = {
	title: "🔗 Base URL & Query Parameters",
	tests: [
		{
			id: "base-url",
			title: "Using Base URL",
			run: async (updateOutput, signal) => {
				const client = createLuminara({ baseURL: 'https://jsonplaceholder.typicode.com' });
				const baseUrlResponse = await client.get('/todos/1', { signal });
				return `Base URL: jsonplaceholder.typicode.com\nEndpoint: /todos/1\nTodo Title: ${baseUrlResponse.data.title}`;
			}
		},
		{
			id: "query-params",
			title: "Query Parameters",
			run: async (updateOutput, signal) => {
				const client = createLuminara();
				const queryResponse = await client.get('https://jsonplaceholder.typicode.com/comments', {
					query: { postId: 1 },
					signal
				});
				return `Query: { postId: 1 }\nFound ${queryResponse.data.length} comments for post 1`;
			}
		}
	]
};
