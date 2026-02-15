/** @type {import('jest').Config} */
module.exports = {
	preset: "ts-jest/presets/default-esm",
	testEnvironment: "jsdom",
	extensionsToTreatAsEsm: [".ts"],
	moduleNameMapper: {
		"^(\\.{1,2}/.*)\\.js$": "$1",
		"^obsidian$": "<rootDir>/tests/mocks/obsidian.ts"
	},
	testMatch: ["**/tests/**/*.test.ts"],
	collectCoverageFrom: ["src/**/*.ts", "!src/main.ts"]
};
