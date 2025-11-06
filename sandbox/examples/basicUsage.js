import { createLuminara } from "../../dist/index.mjs";

export const basicUsage = {
	title: "📦 Basic Usage",
	examples: [
		{
			id: "get-json",
			title: "GET JSON",
			code: `import { createLuminara } from 'luminara';

const client = createLuminara();
const response = await client.getJson('https://api.example.com/todos/1');

console.log(response.status);  // 200
console.log(response.data);    // { id: 1, title: '...', ... }`,
			run: async (updateOutput, signal, options = {}) => {
				const client = createLuminara({ verbose: options.verbose || false });
				const jsonResponse = await client.getJson('https://jsonplaceholder.typicode.com/todos/1', { signal });
				return `Status: ${jsonResponse.status}\nTodo ID: ${jsonResponse.data.id}\nTitle: ${jsonResponse.data.title}`;
			}
		},
		{
			id: "get-text",
			title: "GET Text",
			code: `import { createLuminara } from 'luminara';

const client = createLuminara();
const response = await client.getText('https://api.example.com/data');

console.log(response.status);  // 200
console.log(response.data);    // Plain text content`,
			run: async (updateOutput, signal, options = {}) => {
				const client = createLuminara({ verbose: options.verbose || false });
				const textResponse = await client.getText('https://httpbingo.org/get', { signal });
				return `Status: ${textResponse.status}\nContent Length: ${String(textResponse.data).length} characters`;
			}
		},
		{
			id: "post-json",
			title: "POST JSON",
			code: `import { createLuminara } from 'luminara';

const client = createLuminara();
const response = await client.postJson('https://api.example.com/posts', {
  title: 'My Post',
  body: 'Post content'
});

console.log(response.status);  // 201
console.log(response.data);    // { id: 101, title: 'My Post', ... }`,
			run: async (updateOutput, signal, options = {}) => {
				const client = createLuminara({ verbose: options.verbose || false });
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
			code: `import { createLuminara } from 'luminara';

const client = createLuminara();
const response = await client.postForm('https://api.example.com/submit', {
  username: 'john',
  email: 'john@example.com'
});

console.log(response.status);  // 200
console.log(response.data);    // Form submission result`,
			run: async (updateOutput, signal, options = {}) => {
				const client = createLuminara({ verbose: options.verbose || false });
				const formResponse = await client.postForm('https://httpbingo.org/post', {
					hello: 'world',
					framework: 'luminara'
				}, { signal });
				return `Status: ${formResponse.status}\nForm Fields: ${Object.keys(formResponse.data.form || {}).join(', ')}`;
			}
		}
	]
};
