const activeSpies: jest.SpyInstance[] = [];

declare global {
	var muteConsoleError: () => jest.SpyInstance;
}

globalThis.muteConsoleError = () => {
	const spy = jest.spyOn(console, "error").mockImplementation(() => {});
	activeSpies.push(spy);
	return spy;
};

afterEach(() => {
	for (const spy of activeSpies.splice(0)) {
		spy.mockRestore();
	}
	jest.restoreAllMocks();
});

export {};
