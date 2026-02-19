import { HtmlHandler } from "../src/htmlHandler";
import { ImageHandler } from "../src/imageHandler";
import {
	mockRequestUrlRejected,
	mockRequestUrlResolved,
	resetRequestUrlMock
} from "./helpers/mocks/obsidian";
import { mockSuite } from "./helpers/mocks/pluginGoodies";
import { 
    READABLE_ARTICLE_HTML, 
    APP_URL_HTML, 
    IMAGE_HEAVY_HTML, 
    UNREADABLE_HTML, 
    IMG_NO_SOURCE
} from "./helpers/fixtures/html";

describe("HtmlHandler", () => {
	beforeEach(() => {
        muteConsoleError();
		resetRequestUrlMock();
	});

	describe("fetchToMarkdown", () => {
		it("rejects when requestUrl fails", async () => {
			mockRequestUrlRejected(new Error("Error: Request failed"));

            const { handler, noteFile } = mockSuite(HtmlHandler);

			await expect(
				handler.fetchToMarkdown("https://mock.sample.foo/", noteFile)
			).rejects.toThrow("Error: Request failed");
		});

		it("rejects when Readability does not return article content", async () => {
            mockRequestUrlResolved({
                text: UNREADABLE_HTML,
                arrayBuffer: new ArrayBuffer(0)
            })

            const { handler, noteFile } = mockSuite(HtmlHandler);

            await expect(
                handler.fetchToMarkdown("https://mock.sample.foo/", noteFile)
            ).rejects.toThrow("Readability failed to extract content.")

        });

		it("normalizes app:// URLs in article content", async () => {
            mockRequestUrlResolved({
                text: APP_URL_HTML,
                arrayBuffer: new ArrayBuffer(0)
            })

            const { handler, noteFile } = mockSuite(
                HtmlHandler
            );

            const markdown = await handler.fetchToMarkdown(
				"https://mock.sample.foo/",
				noteFile,
			);
            // TODO: Place holder assertions
            // Move expected markdown into fixtures
            expect(markdown).not.toContain("app://");
            expect(markdown).not.toContain("app://obsidian.md");
        });

		it("returns markdown with title, source link, and body sections", async () => {
			mockRequestUrlResolved({
				text: READABLE_ARTICLE_HTML,
				arrayBuffer: new ArrayBuffer(0)
			});

            const { handler, noteFile } = mockSuite(HtmlHandler);

			const markdown = await handler.fetchToMarkdown(
				"https://mock.sample.foo/",
				noteFile,
			);

			expect(markdown).toContain("# Fixture: Readable Article");
			expect(markdown).toContain("[mock.sample.foo](https://mock.sample.foo/)");
			expect(markdown).toContain("This is a readable article body for markdown conversion tests.");
		});
	});

	describe("fetchToMarkdown image handling", () => {
		it("calls imageHandler.fetchImages by default", async () => {
            mockRequestUrlResolved({
                text: READABLE_ARTICLE_HTML,
				arrayBuffer: new ArrayBuffer(0)
			});

            const fetchImagesMock = jest
                .spyOn(ImageHandler.prototype, "fetchImages")
                .mockResolvedValue(undefined);

            const { handler, noteFile } = mockSuite(HtmlHandler);

            await handler.fetchToMarkdown(
                "https://mock.sample.foo/",
				noteFile
            );

            expect(fetchImagesMock).toHaveBeenCalled();
        });

        it("does not call imageHandler.fetchImages when fetchImages setting is false", async () => {
            mockRequestUrlResolved({
                text: READABLE_ARTICLE_HTML,
				arrayBuffer: new ArrayBuffer(0)
			});

            const fetchImagesMock = jest
                .spyOn(ImageHandler.prototype, "fetchImages")
                .mockResolvedValue(undefined);

            const { handler, noteFile } = mockSuite(HtmlHandler, { fetchImages: false } );
            
            await handler.fetchToMarkdown(
                "https://mock.sample.foo/",
				noteFile,
            );

            expect(fetchImagesMock).not.toHaveBeenCalled();
        });

		it("renders markdown image syntax with alt/title when images are enabled", async () => {
            mockRequestUrlResolved({
                text: IMAGE_HEAVY_HTML,
				arrayBuffer: new ArrayBuffer(0)
			});

            const fetchImagesMock = jest
                .spyOn(ImageHandler.prototype, "fetchImages")
                .mockImplementation(async (doc) => {
                    const first = doc.querySelector('img[alt="First"]');
                    first?.setAttribute("src", "Attachments/first.jpg");
                    first?.removeAttribute("srcset");
                });

            const { handler, noteFile } = mockSuite(HtmlHandler);

            const markdown = await handler.fetchToMarkdown(
                "https://mock.sample.foo/",
				noteFile
            );

            expect(fetchImagesMock).toHaveBeenCalled();
            expect(markdown).toContain('[![First](Attachments/first.jpg)]');
        });

        it("does not emit markdown image when src is empty", async () => {
            mockRequestUrlResolved({
                text: IMG_NO_SOURCE,
                arrayBuffer: new ArrayBuffer(0)
            });

            jest
                .spyOn(ImageHandler.prototype, "fetchImages")
                .mockResolvedValue(undefined);

            const { handler, noteFile } = mockSuite(HtmlHandler);

            const markdown = await handler.fetchToMarkdown(
                "https://mock.sample.foo/",
                noteFile
            );

            expect(markdown).not.toContain("![No source]");
        });
	});

    //TODO: Create this when fixtures are finalized
	describe("regression snapshots", () => {
		it.todo("matches expected markdown output for a representative article fixture");
	});

    describe("coverage todos", () => {
        it.todo("handles extracted article content where body is missing and falls back to empty cleanedHtml");
        it.todo("omits image rule registration when fetchImages is false while still applying table rule");
    });
});
