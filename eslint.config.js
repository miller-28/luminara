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
			'function-paren-newline': ['error', 'consistent'],
			
			// Blank lines - enforce space after class/function declarations
			'lines-between-class-members': ['error', 'always', { 'exceptAfterSingleLine': false }],
			'lines-around-directive': ['error', 'always'],
			'lines-around-comment': ['error', {
				'beforeBlockComment': true,
				'afterBlockComment': false,
				'beforeLineComment': true,
				'afterLineComment': false,
				'allowBlockStart': false,
				'allowBlockEnd': false,
				'allowObjectStart': true,
				'allowObjectEnd': true,
				'allowArrayStart': true,
				'allowArrayEnd': true,
				'allowClassStart': false,
				'allowClassEnd': false
			}],
			'padding-line-between-statements': [
				'error',

				// Require blank line after import statements
				{ 'blankLine': 'always', 'prev': 'import', 'next': '*' },
				{ 'blankLine': 'any', 'prev': 'import', 'next': 'import' },

				// Require blank line after function declarations (including export function)
				{ 'blankLine': 'always', 'prev': ['function', 'class'], 'next': '*' },

				// Require blank line after export default
				{ 'blankLine': 'always', 'prev': 'export', 'next': '*' },

				// Allow consecutive exports without blank lines
				{ 'blankLine': 'any', 'prev': 'export', 'next': 'export' },

				// Require blank line before return statements
				{ 'blankLine': 'always', 'prev': '*', 'next': 'return' }
			]
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
			'node_modules/**',
			'dist/**',
			'*.min.js',
			'coverage/**'
		]
	}
];
