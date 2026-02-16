import { HtmlHandler } from "../src/htmlHandler";
import { ImageHandler } from "../src/imageHandler";
import {
	makePluginMock,
	makeTFileMock,
	mockRequestUrlRejected,
	mockRequestUrlResolved,
	resetRequestUrlMock
} from "./mocks/obsidian";
import { 
    READABLE_ARTICLE_HTML, 
    APP_URL_HTML, 
    IMAGE_HEAVY_HTML, 
    UNREADABLE_HTML 
} from "./fixtures/html";

describe("HtmlHandler", () => {
	beforeEach(() => {
        muteConsoleError();
		resetRequestUrlMock();
	});

	describe("fetchToMarkdown", () => {
		it("rejects when requestUrl fails", async () => {
			mockRequestUrlRejected(new Error("Error: Request failed"));

			const handler = new HtmlHandler(makePluginMock() as never);
			const noteFile = makeTFileMock("Notes/Test.md") as never;

			await expect(
				handler.fetchToMarkdown("https://mock.sample.foo/post", noteFile, false)
			).rejects.toThrow("Error: Request failed");
		});

		it("rejects when Readability does not return article content", async () => {
            mockRequestUrlResolved({
                text: UNREADABLE_HTML,
                arrayBuffer: new ArrayBuffer(0)
            })

            const handler = new HtmlHandler(makePluginMock() as never);
			const noteFile = makeTFileMock("Notes/Test.md") as never;

            await expect(
                handler.fetchToMarkdown("https://mock.sample.foo/post", noteFile, false)
            ).rejects.toThrow("Readability failed to extract content.")

        });

		it("normalizes app:// URLs in article content", async () => {
            mockRequestUrlResolved({
                text: APP_URL_HTML,
                arrayBuffer: new ArrayBuffer(0)
            })
            
            const handler = new HtmlHandler(makePluginMock() as never);
			const noteFile = makeTFileMock("Notes/Test.md") as never;

            const markdown = await handler.fetchToMarkdown(
				"https://mock.sample.foo/post",
				noteFile,
				false
			);
            // TODO: Place holder assertions
            // Move expected markdown into fixtures
            expect(markdown).not.toContain("app://");
            expect(markdown).not.toContain("app://obsidian.md")
        });

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
		it("calls imageHandler.fetchImages by default", async () => {
            mockRequestUrlResolved({
                text: READABLE_ARTICLE_HTML,
				arrayBuffer: new ArrayBuffer(0)
			});

            const fetchImagesMock = jest
                .spyOn(ImageHandler.prototype, "fetchImages")
                .mockResolvedValue(Promise.resolve());

            const handler = new HtmlHandler(makePluginMock() as never);
			const noteFile = makeTFileMock("Notes/Test.md") as never;

            await handler.fetchToMarkdown(
                "https://mock.sample.foo/post",
				noteFile
            );

            expect(fetchImagesMock).toHaveBeenCalled();
        });

		it("does not call imageHandler.fetchImages when fetchImages is false", async () => {
            mockRequestUrlResolved({
                text: READABLE_ARTICLE_HTML,
				arrayBuffer: new ArrayBuffer(0)
			});

            const fetchImagesMock = jest
                .spyOn(ImageHandler.prototype, "fetchImages")
                .mockResolvedValue(Promise.resolve());

            const handler = new HtmlHandler(makePluginMock() as never);
			const noteFile = makeTFileMock("Notes/Test.md") as never;

            await handler.fetchToMarkdown(
                "https://mock.sample.foo/post",
				noteFile,
                false
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

            const handler = new HtmlHandler(makePluginMock() as never);
			const noteFile = makeTFileMock("Notes/Test.md") as never;

            const markdown = await handler.fetchToMarkdown(
                "https://mock.sample.foo/post",
				noteFile
            );

            expect(fetchImagesMock).toHaveBeenCalled();
            expect(markdown).toContain('[![First](Attachments/first.jpg)]');
        });

        it("does not emit markdown image when src is empty", async () => {
            mockRequestUrlResolved({
                text: `
                    <!doctype html>
                    <html>
                      <head><title>Fixture: Empty image src</title></head>
                      <body>
                        <article>
                          <h1>Image edge case</h1>
                          <img alt="No source" title="No source title" />
                        </article>
                      </body>
                    </html>
                `,
                arrayBuffer: new ArrayBuffer(0)
            });

            jest
                .spyOn(ImageHandler.prototype, "fetchImages")
                .mockResolvedValue(Promise.resolve());

            const handler = new HtmlHandler(makePluginMock() as never);
            const noteFile = makeTFileMock("Notes/Test.md") as never;

            const markdown = await handler.fetchToMarkdown(
                "https://mock.sample.foo/post",
                noteFile
            );

            expect(markdown).not.toContain("![No source]");
        });
	});

    //TODO: Create this when fixtures are finalized
	describe("regression snapshots", () => {
		it.todo("matches expected markdown output for a representative article fixture");
	});
});
