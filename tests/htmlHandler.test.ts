import { HtmlHandler } from "../src/htmlHandler";
import {
	makePluginMock,
	makeTFileMock,
	mockRequestUrlRejected,
	mockRequestUrlResolved,
	resetRequestUrlMock
} from "./mocks/obsidian";
import { READABLE_ARTICLE_HTML } from "./fixtures/html";

describe("HtmlHandler", () => {
	beforeEach(() => {
        muteConsoleError();
		resetRequestUrlMock();
	});

	describe("fetchToMarkdown", () => {
		it("rejects when requestUrl fails", async () => {
			mockRequestUrlRejected(new Error("network down"));

			const handler = new HtmlHandler(makePluginMock() as never);
			const noteFile = makeTFileMock("Notes/Test.md") as never;

			await expect(
				handler.fetchToMarkdown("https://mock.sample.foo/post", noteFile, false)
			).rejects.toThrow("network down");
		});

		it.todo("rejects when Readability does not return article content");

		it.todo("rejects when markdown body is empty after conversion");

		it.todo("absolutizes fragment href links before conversion");

		it.todo("normalizes app:// URLs in article content");

		it("returns markdown with title, source link, and body sections", async () => {
			mockRequestUrlResolved({
				text: READABLE_ARTICLE_HTML,
				arrayBuffer: new ArrayBuffer(0)
			});

			const handler = new HtmlHandler(makePluginMock() as never);
			const noteFile = makeTFileMock("Notes/Test.md") as never;

			const markdown = await handler.fetchToMarkdown(
				"https://mock.sample.foo/post",
				noteFile,
				false
			);

			expect(markdown).toContain("# Fixture: Readable Article");
			expect(markdown).toContain("[mock.sample.foo](https://mock.sample.foo/post)");
			expect(markdown).toContain("This is a readable article body for markdown conversion tests.");
		});
	});

	describe("fetchToMarkdown image handling", () => {
		it.todo("calls imageHandler.fetchImages by default");
		it.todo("does not call imageHandler.fetchImages when fetchImages is false");
		it.todo("renders markdown image syntax with alt/title when images are enabled");
	});

	describe("regression snapshots", () => {
		it.todo("matches expected markdown output for a representative article fixture");
	});
});
