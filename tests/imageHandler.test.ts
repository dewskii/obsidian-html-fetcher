
import * as utils from "../src/utils";
import { ImageHandler } from "../src/imageHandler";
import { IMAGE_HEAVY_HTML, UNSAFE_FILENAME_IMAGE_HTML } from "./fixtures/html";
import {
	makePluginMock,
	makeTFileMock,
	mockRequestUrlResolved,
	resetRequestUrlMock,
    requestUrl
} from './mocks/obsidian'

describe("ImageHandler", () => {
    beforeEach(() => {
        muteConsoleError();
		resetRequestUrlMock();
    });

	describe("fetchImages", () => {
        describe("folder setup", () => {
            it("creates an Attachments folder in the note directory when missing", async () => {
                mockRequestUrlResolved({
                    text: IMAGE_HEAVY_HTML,
                    arrayBuffer: new ArrayBuffer(0)
                })
                const plugin = makePluginMock()
                const handler = new ImageHandler(plugin as never);
                const noteFile = makeTFileMock("Notes/Test.md") as never;

                await handler.fetchImages(new Document(), "https://mock.sample.foo/post", noteFile);

                expect(plugin.app.vault.createFolder).toHaveBeenCalledTimes(1);

            });
            it.todo("continues when createFolder throws because folder already exists");
        });

        describe("image selection and URL resolution", () => {
            it.todo("skips img elements with no src attribute");
            it.todo("resolves relative image src values against pageUrl");
            it.todo("skips invalid image src values that cannot form a URL");
        });

        describe("download and write flow", () => {
            it("requests each image using the computed absolute URL", async () => {
                mockRequestUrlResolved({
                    text: IMAGE_HEAVY_HTML,
                    arrayBuffer: new ArrayBuffer(0)
                });

                const plugin = makePluginMock();
                const handler = new ImageHandler(plugin as never);
                const noteFile = makeTFileMock("Notes/Test.md") as never;
                const document = new DOMParser().parseFromString(IMAGE_HEAVY_HTML, "text/html");

                await handler.fetchImages(document, "https://mock.sample.foo/post", noteFile);

                expect(requestUrl).toHaveBeenCalledTimes(3);
                expect(requestUrl).toHaveBeenCalledWith({url: "https://mock.sample.foo/assets/first.jpg"});
                expect(requestUrl).toHaveBeenCalledWith({url: "https://mock.separate.foo/assets/second" });
                expect(requestUrl).toHaveBeenCalledWith({url: "https://mock.sample.foo/assets/third-250.png"});
            });

            it("writes downloaded bytes to normalized Attachments path", async () => {
                const buffer = new ArrayBuffer(0);
                mockRequestUrlResolved({
                    text: IMAGE_HEAVY_HTML,
                    arrayBuffer: buffer
                })

                const plugin = makePluginMock()
                const handler = new ImageHandler(plugin as never);
                const noteFile = makeTFileMock("Notes/Test.md") as never;
                const document = new DOMParser().parseFromString(IMAGE_HEAVY_HTML, "text/html");

                await handler.fetchImages(document, "https://mock.sample.foo/post", noteFile);

                expect(plugin.app.vault.adapter.writeBinary)
                    .toHaveBeenCalledWith("Notes/Attachments/first.jpg", buffer);
            });

            it("adds .img extension when URL filename has no extension", async () => {
                const buffer = new ArrayBuffer(0);
                mockRequestUrlResolved({
                    text: IMAGE_HEAVY_HTML,
                    arrayBuffer: buffer
                });

                const plugin = makePluginMock()
                const handler = new ImageHandler(plugin as never);
                const noteFile = makeTFileMock("Notes/Test.md") as never;
                const document = new DOMParser().parseFromString(IMAGE_HEAVY_HTML, "text/html");
                const sanitizes = jest.spyOn(utils, "sanitizeFilename");
                
                await handler.fetchImages(document, "https://mock.sample.foo/post", noteFile);

                expect(plugin.app.vault.adapter.writeBinary)
                    .toHaveBeenCalledWith("Notes/Attachments/second.img", buffer);

                expect(sanitizes).toHaveBeenCalledWith("second.img");

            });
            it("sanitizes unsafe filename characters before writing", async () => {
                mockRequestUrlResolved({
                    text: UNSAFE_FILENAME_IMAGE_HTML,
                    arrayBuffer: new ArrayBuffer(0)
                });

                const plugin = makePluginMock()
                const handler = new ImageHandler(plugin as never);
                const noteFile = makeTFileMock("Notes/Test.md") as never;
                const document = new DOMParser().parseFromString(UNSAFE_FILENAME_IMAGE_HTML, "text/html");
                const sanitizes = jest.spyOn(utils, "sanitizeFilename");
                
                await handler.fetchImages(document, "https://mock.sample.foo/post", noteFile);
                
                expect(sanitizes).toHaveBeenCalledWith("unsafe%3Cname%3E:bad.img");
                expect(sanitizes).toHaveReturnedWith("unsafe<name>_bad.img");

            });
        });

        describe("src mutation", () => {
            it("rewrites img src to local Attachments/<filename> after successful write", async () => {
                mockRequestUrlResolved({
                    text: IMAGE_HEAVY_HTML,
                    arrayBuffer: new ArrayBuffer(0)
                });

                const handler = new ImageHandler(makePluginMock() as never);
                const noteFile = makeTFileMock("Notes/Test.md") as never;
                const document = new DOMParser().parseFromString(IMAGE_HEAVY_HTML, "text/html");
                
                await handler.fetchImages(document, "https://mock.sample.foo/post", noteFile);
                const imgSrcs = Array.from(document.querySelectorAll("img"))
                                    .map((img) => img.getAttribute("src")).filter(Boolean);

                expect(imgSrcs).toEqual(
                    expect.arrayContaining(
                        ["Attachments/first.jpg", "Attachments/second.img", "Attachments/third-250.png"]
                    )
                );
            });

            it("removes srcset after successful localization", async () => {
                mockRequestUrlResolved({
                    text: IMAGE_HEAVY_HTML,
                    arrayBuffer: new ArrayBuffer(0)
                });
                const handler = new ImageHandler(makePluginMock() as never);
                const noteFile = makeTFileMock("Notes/Test.md") as never;
                const document = new DOMParser().parseFromString(IMAGE_HEAVY_HTML, "text/html");
                
                await handler.fetchImages(document, "https://mock.sample.foo/post", noteFile);
                
                const imgSrcs = Array.from(document.querySelectorAll("img"))
                                    .map((img) => img.getAttribute("srcset")).filter(Boolean);
                
                expect(imgSrcs.length).toBe(0);

            });
        });

        describe("error handling", () => {
            it.todo("logs a warning and continues when one image fetch fails");
            it.todo("continues processing remaining images after a failure");
            it.todo("handles notes with no parent directory by using workspace Attachments path");
        });
	});
});
