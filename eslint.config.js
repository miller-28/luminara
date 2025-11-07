import js from '@eslint/js';
import globals from 'globals';

export default [
	{
		files: ['**/*.{js,mjs,cjs}'],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
			globals: {
				...globals.browser,
				...globals.node,
				...globals.es2021
			}
		},
		rules: {
			// Indentation: Use tabs (4 spaces wide)
			'indent': ['error', 'tab', { 'SwitchCase': 1 }],
			
			// Code quality
			'no-unused-vars': 'off', // Disabled - allow unused variables
			'no-console': 'off', // Allow console for debugging
			'no-debugger': 'warn',
			
			// Best practices
			'eqeqeq': ['error', 'always'],
			'curly': ['error', 'all'],
			'brace-style': ['error', '1tbs'],
			
			// ES6+
			'prefer-const': 'error',
			'no-var': 'error',
			'arrow-spacing': 'error',
			
			// Spacing
			'semi': ['error', 'always'],
			'quotes': ['error', 'single', { 'avoidEscape': true }],
			'comma-spacing': ['error', { 'before': false, 'after': true }],
			'key-spacing': ['error', { 'beforeColon': false, 'afterColon': true }],
			'space-before-blocks': 'error',
			'keyword-spacing': 'error',
			
			// Multi-line
			'object-curly-newline': ['error', { 'multiline': true, 'consistent': true }],
			'function-paren-newline': ['error', 'consistent']
		}
	},
	{
		files: ['src/**/*.js'],
		rules: {
			// Stricter rules for source code (no-unused-vars still disabled globally)
		}
	},
	{
		files: ['sandbox/**/*.js', 'test-cli/**/*.js'],
		rules: {
			// Relaxed rules for sandbox and tests (no-unused-vars already off globally)
		}
	},
	{
		ignores: [
      'eslint.config.js',
			'node_modules/**',
			'dist/**',
			'*.min.js',
			'coverage/**'
		]
	}
];
