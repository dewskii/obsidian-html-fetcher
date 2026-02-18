import { debugLog, warnLog, errorLog } from "../src/loggers";

describe("loggers", () => {
	beforeEach(() => {
		jest.restoreAllMocks();
	});

	describe("debugLog", () => {
        //adding this one for defensive object paths
        // this edgecase probably won't ever exist
		it("does not log when settings are missing", () => {
			const spy = jest.spyOn(console, "debug").mockImplementation(() => {});

			debugLog(undefined, "debug message");

			expect(spy).not.toHaveBeenCalled();
		});

		it("does not log when debug is false", () => {
			const spy = jest.spyOn(console, "debug").mockImplementation(() => {});

			debugLog({ debug: false }, "debug message");

			expect(spy).not.toHaveBeenCalled();
		});

		it("logs when debug is true", () => {
			const spy = jest.spyOn(console, "debug").mockImplementation(() => {});

			debugLog({ debug: true }, "debug message", { key: "value" });

			expect(spy).toHaveBeenCalledWith("debug message", { key: "value" });
		});
	});

	describe("warnLog", () => {
		it("prefixes scope in warning output", () => {
			const spy = jest.spyOn(console, "warn").mockImplementation(() => {});

			warnLog("image", "Image fetch failed:", "https://example.com/img.png", new Error("boom"));

			expect(spy).toHaveBeenCalledWith(
				"[image] Image fetch failed:",
				"https://example.com/img.png",
				expect.any(Error)
			);
		});
	});

	describe("errorLog", () => {
		it("prefixes scope in error output", () => {
			const spy = jest.spyOn(console, "error").mockImplementation(() => {});

			errorLog("trigger", "Editor fetch failed", new Error("boom"));

			expect(spy).toHaveBeenCalledWith(
				"[trigger] Editor fetch failed",
				expect.any(Error)
			);
		});
	});
});
