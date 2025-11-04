import { createLuminara } from "../../dist/index.mjs";

export const responseTypes = {
	title: "📦 Response Type Options",
	examples: [
	{
		id: 'response-type-text',
		title: 'responseType: "text"',
		run: async (updateOutput, signal, options = {}) => {
			const luminara = createLuminara({ verbose: options.verbose || false });
			
			updateOutput('📝 Testing responseType: "text" - forcing text response...');
			
			try {
				const response = await luminara.get('https://httpbingo.org/json', {
					responseType: 'text',
					signal
				});
				
				updateOutput(`✅ Response type: ${typeof response.data}`);
				updateOutput(`📝 Sample content: ${response.data.substring(0, 100)}...`);
				
				if (typeof response.data !== 'string') {
					throw new Error(`Expected string, got ${typeof response.data}`);
				}
				
				return 'SUCCESS: Text response received';
			} catch (error) {
				updateOutput(`❌ Error: ${error.message}`);
				throw error;
			}
		}
	},
	
	{
		id: 'response-type-json',
		title: 'responseType: "json"',
		run: async (updateOutput, signal, options = {}) => {
			const luminara = createLuminara({ verbose: options.verbose || false });
			
			updateOutput('🔧 Testing responseType: "json" - explicit JSON parsing...');
			
			try {
				const response = await luminara.get('https://httpbingo.org/json', {
					responseType: 'json',
					signal
				});
				
				updateOutput(`✅ Response type: ${typeof response.data}`);
				updateOutput(`📝 JSON keys: ${Object.keys(response.data).join(', ')}`);
				
				if (typeof response.data !== 'object') {
					throw new Error(`Expected object, got ${typeof response.data}`);
				}
				
				return 'SUCCESS: JSON response parsed';
			} catch (error) {
				updateOutput(`❌ Error: ${error.message}`);
				throw error;
			}
		}
	},
	
	{
		id: 'response-type-blob',
		title: 'responseType: "blob"',
		run: async (updateOutput, signal, options = {}) => {
			const luminara = createLuminara({ verbose: options.verbose || false });
			
			updateOutput('📦 Testing responseType: "blob" - getting Blob object...');
			
			if (typeof Blob === 'undefined') {
				updateOutput('⚠️  Blob not available in this environment');
				return 'SKIPPED: Blob not available';
			}
			
			try {
				const response = await luminara.get('https://httpbingo.org/json', {
					responseType: 'blob',
					signal
				});
				
				updateOutput(`✅ Response type: ${response.data.constructor.name}`);
				updateOutput(`📝 Blob size: ${response.data.size} bytes`);
				updateOutput(`📝 Blob type: ${response.data.type || 'unknown'}`);
				
				if (!(response.data instanceof Blob)) {
					throw new Error(`Expected Blob, got ${response.data.constructor.name}`);
				}
				
				return 'SUCCESS: Blob response received';
			} catch (error) {
				updateOutput(`❌ Error: ${error.message}`);
				throw error;
			}
		}
	},
	
	{
		id: 'response-type-stream',
		title: 'responseType: "stream"',
		run: async (updateOutput, signal, options = {}) => {
			const luminara = createLuminara({ verbose: options.verbose || false });
			
			updateOutput('🌊 Testing responseType: "stream" - getting ReadableStream...');
			
			if (typeof ReadableStream === 'undefined') {
				updateOutput('⚠️  ReadableStream not available in this environment');
				return 'SKIPPED: ReadableStream not available';
			}
			
			try {
				const response = await luminara.get('https://httpbingo.org/json', {
					responseType: 'stream',
					signal
				});
				
				updateOutput(`✅ Response type: ${response.data.constructor.name}`);
				updateOutput(`📝 Stream locked: ${response.data.locked}`);
				
				if (!(response.data instanceof ReadableStream)) {
					throw new Error(`Expected ReadableStream, got ${response.data.constructor.name}`);
				}
				
				// Read a bit of the stream to verify it works
				const reader = response.data.getReader();
				const { value, done } = await reader.read();
				reader.releaseLock();
				
				if (!done) {
					updateOutput(`📝 First chunk length: ${value.length} bytes`);
				}
				
				return 'SUCCESS: ReadableStream response received';
			} catch (error) {
				updateOutput(`❌ Error: ${error.message}`);
				throw error;
			}
		}
	},
	
	{
		id: 'response-type-arraybuffer',
		title: 'responseType: "arrayBuffer"',
		run: async (updateOutput, signal, options = {}) => {
			const luminara = createLuminara({ verbose: options.verbose || false });
			
			updateOutput('🔢 Testing responseType: "arrayBuffer" - getting ArrayBuffer...');
			
			try {
				const response = await luminara.get('https://httpbingo.org/json', {
					responseType: 'arrayBuffer',
					signal
				});
				
				updateOutput(`✅ Response type: ${response.data.constructor.name}`);
				updateOutput(`📝 Buffer size: ${response.data.byteLength} bytes`);
				
				if (!(response.data instanceof ArrayBuffer)) {
					throw new Error(`Expected ArrayBuffer, got ${response.data.constructor.name}`);
				}
				
				return 'SUCCESS: ArrayBuffer response received';
			} catch (error) {
				updateOutput(`❌ Error: ${error.message}`);
				throw error;
			}
		}
	},
	
	{
		id: 'response-type-auto',
		title: 'responseType: "auto" (default)',
		run: async (updateOutput, signal, options = {}) => {
			const luminara = createLuminara({ verbose: options.verbose || false });
			
			updateOutput('🤖 Testing responseType: "auto" - automatic content detection...');
			
			try {
				const response = await luminara.get('https://httpbingo.org/json', {
					responseType: 'auto',  // explicit auto
					signal
				});
				
				updateOutput(`✅ Auto-detected type: ${typeof response.data}`);
				updateOutput(`📝 JSON keys: ${Object.keys(response.data).join(', ')}`);
				
				if (typeof response.data !== 'object') {
					throw new Error(`Expected object from auto-detection, got ${typeof response.data}`);
				}
				
				return 'SUCCESS: Auto-detection worked correctly';
			} catch (error) {
				updateOutput(`❌ Error: ${error.message}`);
				throw error;
			}
		}
	},
	
	{
		id: 'response-type-default',
		title: 'Default behavior (no responseType)',
		run: async (updateOutput, signal, options = {}) => {
			const luminara = createLuminara({ verbose: options.verbose || false });
			
			updateOutput('📝 Testing default behavior - no responseType specified...');
			
			try {
				const response = await luminara.get('https://httpbingo.org/json', {
					signal
				});
				
				updateOutput(`✅ Default behavior type: ${typeof response.data}`);
				updateOutput(`📝 JSON keys: ${Object.keys(response.data).join(', ')}`);
				
				if (typeof response.data !== 'object') {
					throw new Error(`Expected object from default behavior, got ${typeof response.data}`);
				}
				
				return 'SUCCESS: Default auto-detection working';
			} catch (error) {
				updateOutput(`❌ Error: ${error.message}`);
				throw error;
			}
		}
	}
	]
};