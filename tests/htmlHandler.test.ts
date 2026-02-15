import { HtmlHandler } from "../src/htmlHandler";

describe("HtmlHandler", () => {
	describe("fetchToMarkdown", () => {
		it.todo("rejects when requestUrl fails");
		it.todo("rejects when Readability does not return article content");
		it.todo("rejects when markdown body is empty after conversion");

		it.todo("absolutizes fragment href links before conversion");
		it.todo("normalizes app:// URLs in article content");
        it.todo("returns markdown with title, source link, and body sections");
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