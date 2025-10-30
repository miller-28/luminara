import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/index.js'],
	format: ['esm', 'cjs'],
	outDir: 'dist',
	clean: true,
	sourcemap: true,
	dts: false, // We'll handle types differently since we're using pure JS
	minify: false, // Keep readable for debugging
	splitting: false,
	bundle: true,
	external: ['ofetch'], // Keep ofetch as external peer dependency
	platform: 'browser',
	target: 'es2020',
	treeshake: true,
	outExtension({ format }) {
		return {
			js: format === 'cjs' ? '.cjs' : '.mjs'
		};
	}
});