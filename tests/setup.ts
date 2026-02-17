const activeSpies: jest.SpyInstance[] = [];

declare global {
	var muteConsoleError: () => jest.SpyInstance;
	var urlSpy: () => jest.SpyInstance;
}

const RealURL = global.URL;

globalThis.urlSpy = () => {
	const spy = jest.spyOn(global, "URL")
		.mockImplementation(((value: string | URL, base?: string | URL) => {
			if (value === "big-bad-src-url") {
				throw new TypeError("Invalid URL");
			}
			return new RealURL(value, base);
		}) as any);
	return spy;
}

globalThis.muteConsoleError = (logType: string = "error") => {
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
