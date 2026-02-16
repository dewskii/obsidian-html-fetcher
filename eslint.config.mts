import tseslint from 'typescript-eslint';
import obsidianmd from "eslint-plugin-obsidianmd";
import jestPlugin from "eslint-plugin-jest";
import globals from "globals";
import { globalIgnores } from "eslint/config";

export default tseslint.config(
	{
		languageOptions: {
			globals: {
				...globals.browser,
			},
			parserOptions: {
				projectService: {
					allowDefaultProject: [
						'eslint.config.js',
						'manifest.json'
					]
				},
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: ['.json']
			},
		},
	},
	...obsidianmd.configs.recommended,
	{
		files: ["tests/**/*.ts"],
		plugins: {
			jest: jestPlugin,
		},
		languageOptions: {
			globals: {
				...globals.jest,
				muteConsoleError: "readonly",
			},
		},
		rules: {
			...(jestPlugin.configs["flat/recommended"]?.rules ?? {}),
		},
	},
	globalIgnores([
		"node_modules",
		"dist",
		"esbuild.config.mjs",
		"eslint.config.js",
		"version-bump.mjs",
		"versions.json",
		"main.js",
		"html-fetcher",
		"Test Vault",
		"Project Notes"
	]),
);
