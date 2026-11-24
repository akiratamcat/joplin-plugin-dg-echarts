// ESLint flat config (design 21.3: lint / type check).
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{
		ignores: ['api/**', 'dist/**', 'publish/**', 'vendor/**', 'spike/**', 'coverage/**', 'node_modules/**', '*.config.js', 'webpack.config.js', 'webpack.viewer.js'],
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		rules: {
			// Names starting with _ mark parameters required by an API but unused.
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
		},
	},
	{
		// Node scripts (CommonJS), such as tests/manual/generate-large-note.cjs.
		files: ['**/*.cjs'],
		languageOptions: {
			sourceType: 'commonjs',
			globals: { require: 'readonly', module: 'writable', __dirname: 'readonly', console: 'readonly', process: 'readonly' },
		},
		rules: {
			'@typescript-eslint/no-require-imports': 'off',
		},
	},
);
