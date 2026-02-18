
import * as utils from "../src/utils";
import { ImageHandler } from "../src/imageHandler";
import { APP_URL_HTML, BAD_SRC_HTML, IMAGE_HEAVY_HTML, SPARSE_SRC_HTML, UNSAFE_FILENAME_IMAGE_HTML } from "./fixtures/html";
import {
	makePluginMock,
	makeTFileMock,
	mockRequestUrlResolved,
	resetRequestUrlMock,
    requestUrl,
    mockRequestUrlRejected,
    resetNormalizePathMock
} from './mocks/obsidian'

describe("ImageHandler", () => {
    beforeEach(() => {
        muteConsoleError();
		resetRequestUrlMock();
    });

	describe("fetchImages", () => {
        describe("folder setup", () => {
            it("creates an Attachments folder when missing", async () => {
                const sourceHTML = APP_URL_HTML;
                const buffer = new ArrayBuffer(0);
                mockRequestUrlResolved({
                    text: sourceHTML,
                    arrayBuffer: buffer
                })
                
                const plugin = makePluginMock();
                const handler = new ImageHandler(plugin as never);
                const noteFile = makeTFileMock("Notes/Test.md") as never;
                const document = new DOMParser().parseFromString(sourceHTML, "text/html");

                await handler.fetchImages(document, "https://mock.sample.foo/", noteFile);

                expect(plugin.app.vault.createFolder).toHaveBeenCalledTimes(1);
                expect(plugin.app.vault.createFolder).toHaveBeenCalledWith("Notes/Attachments");

            });
            it("continues when createFolder throws because folder already exists", async () => {
                const sourceHTML = APP_URL_HTML;
                const buffer = new ArrayBuffer(0);
                mockRequestUrlResolved({
                    text: sourceHTML,
                    arrayBuffer: buffer
                })

                const plugin = makePluginMock()
                const handler = new ImageHandler(plugin as never);
                const noteFile = makeTFileMock("Notes/Test.md") as never;
                const document = new DOMParser().parseFromString(sourceHTML, "text/html");
                
                //kinda seems hacky, requestUrl would only get called if ensureFolder continues
                plugin.app.vault.createFolder = jest.fn().mockRejectedValueOnce(new Error());

                await handler.fetchImages(document, "https://mock.sample.foo/", noteFile);
                
                expect(requestUrl).toHaveBeenCalled();


            });
            it("creates and writes to the attachmentFolderPath if set in settings", async () => {
                const sourceHTML = APP_URL_HTML;
                const buffer = new ArrayBuffer(0);
                mockRequestUrlResolved({
                    text: sourceHTML,
                    arrayBuffer: buffer
                })

                const plugin = makePluginMock()
                const handler = new ImageHandler(plugin as never);
                const noteFile = makeTFileMock("Notes/Test.md") as never;
                const document = new DOMParser().parseFromString(sourceHTML, "text/html");
                
                plugin.settings.attachmentFolderPath = 'MyResources/Images'

                await handler.fetchImages(document, "https://mock.sample.foo/", noteFile);

                expect(plugin.app.vault.adapter.writeBinary).toHaveBeenCalledWith('MyResources/Images/photo.png', buffer)
            });
        });

        describe("image selection and URL resolution", () => {
            it("skips img elements with no src attribute", async () => {
                const sourceHTML = SPARSE_SRC_HTML;
                const buffer = new ArrayBuffer(0);
                mockRequestUrlResolved({
                    text: SPARSE_SRC_HTML,
                    arrayBuffer: buffer
                })

                const plugin = makePluginMock();
                const handler = new ImageHandler(plugin as never);
                const noteFile = makeTFileMock("Notes/Test.md") as never;
                const document = new DOMParser().parseFromString(sourceHTML, "text/html");

                await handler.fetchImages(document, "https://mock.sample.foo/", noteFile);

                expect(requestUrl).toHaveBeenCalledTimes(1);
                expect(requestUrl).toHaveBeenCalledWith({url: "https://mock.sample.com/media/real.png"});
            });

            it("skips invalid image src values that cannot form a URL", async () => {
                const sourceHTML = BAD_SRC_HTML;
                const buffer = new ArrayBuffer(0);
                mockRequestUrlResolved({
                    text: sourceHTML,
                    arrayBuffer: buffer
                });

                urlSpy();

                const plugin = makePluginMock();
                const handler = new ImageHandler(plugin as never);
                const noteFile = makeTFileMock("Notes/Test.md") as never;
                const document = new DOMParser().parseFromString(sourceHTML, "text/html");

                await handler.fetchImages(document, "https://mock.sample.foo/", noteFile);
                
                expect(requestUrl).toHaveBeenCalledTimes(1);
                expect(requestUrl).toHaveBeenCalledWith({url: "https://mock.sample.com/media/real.png"});
            });
        });

        describe("download and write flow", () => {
            it("requests each image using the computed absolute URL", async () => {
                const sourceHTML = IMAGE_HEAVY_HTML
                const buffer = new ArrayBuffer(0);
                mockRequestUrlResolved({
                    text: sourceHTML,
                    arrayBuffer: buffer
                });

                const plugin = makePluginMock();
                const handler = new ImageHandler(plugin as never);
                const noteFile = makeTFileMock("Notes/Test.md") as never;
                const document = new DOMParser().parseFromString(sourceHTML, "text/html");

                await handler.fetchImages(document, "https://mock.sample.foo/", noteFile);

                expect(requestUrl).toHaveBeenCalledTimes(3);
                expect(requestUrl).toHaveBeenCalledWith({url: "https://mock.sample.foo/assets/first.jpg"});
                expect(requestUrl).toHaveBeenCalledWith({url: "https://mock.separate.foo/assets/second" });
                expect(requestUrl).toHaveBeenCalledWith({url: "https://mock.sample.foo/assets/third-250.png"});
            });

            it("adds .img extension when URL filename has no extension", async () => {
                const buffer = new ArrayBuffer(0);
                const sourceHTML = IMAGE_HEAVY_HTML
                mockRequestUrlResolved({
                    text: sourceHTML,
                    arrayBuffer: buffer
                });

                const plugin = makePluginMock();
                const handler = new ImageHandler(plugin as never);
                const noteFile = makeTFileMock("Notes/Test.md") as never;
                const document = new DOMParser().parseFromString(sourceHTML, "text/html");
                const sanitizes = jest.spyOn(utils, "sanitizeFilename");
                
                await handler.fetchImages(document, "https://mock.sample.foo/", noteFile);

                expect(plugin.app.vault.adapter.writeBinary)
                    .toHaveBeenCalledWith("Notes/Attachments/second.img", buffer);

                expect(sanitizes).toHaveBeenCalledWith("second.img");

            });
            it("sanitizes unsafe filename characters before writing", async () => {
                const sourceHTML = UNSAFE_FILENAME_IMAGE_HTML;
                const buffer = new ArrayBuffer(0)
                mockRequestUrlResolved({
                    text: sourceHTML,
                    arrayBuffer: buffer
                });

                const plugin = makePluginMock();
                const handler = new ImageHandler(plugin as never);
                const noteFile = makeTFileMock("Notes/Test.md") as never;
                const document = new DOMParser().parseFromString(sourceHTML, "text/html");
                const sanitizes = jest.spyOn(utils, "sanitizeFilename");
                
                await handler.fetchImages(document, "https://mock.sample.foo/", noteFile);
                
                expect(sanitizes).toHaveBeenCalledWith("unsafe%3Cname%3E:bad.img");
                expect(plugin.app.vault.adapter.writeBinary)
                    .toHaveBeenCalledWith("Notes/Attachments/unsafe<name>_bad.img", buffer)

            });
        });

        describe("src mutation", () => {
            it("rewrites img src to local Attachments/<filename> after successful write", async () => {
                const sourceHTML = IMAGE_HEAVY_HTML
                const buffer = new ArrayBuffer(0);
                mockRequestUrlResolved({
                    text: sourceHTML,
                    arrayBuffer: buffer
                });

                const handler = new ImageHandler(makePluginMock() as never);
                const noteFile = makeTFileMock("Notes/Test.md") as never;
                const document = new DOMParser().parseFromString(sourceHTML, "text/html");
                
                await handler.fetchImages(document, "https://mock.sample.foo/", noteFile);
                const imgSrcs = Array.from(document.querySelectorAll("img"))
                                    .map((img) => img.getAttribute("src")).filter(Boolean);

                expect(imgSrcs).toEqual(
                    expect.arrayContaining(
                        ["Notes/Attachments/first.jpg", "Notes/Attachments/second.img", "Notes/Attachments/third-250.png"]
                    )
                );
            });

            it("removes srcset after successful localization", async () => {
                const sourceHTML = IMAGE_HEAVY_HTML;
                const buffer = new ArrayBuffer(0);
                mockRequestUrlResolved({
                    text: sourceHTML,
                    arrayBuffer: buffer
                });
                const handler = new ImageHandler(makePluginMock() as never);
                const noteFile = makeTFileMock("Notes/Test.md") as never;
                const document = new DOMParser().parseFromString(sourceHTML, "text/html");
                
                await handler.fetchImages(document, "https://mock.sample.foo/", noteFile);
                
                const imgSrcs = Array.from(document.querySelectorAll("img"))
                                    .map((img) => img.getAttribute("srcset")).filter(Boolean);
                
                expect(imgSrcs.length).toBe(0);

            });
        });

        describe("error handling", () => {
            beforeEach(() => {
                resetNormalizePathMock();
            });
            it("logs a warning and continues when one image fetch fails", async () => {
                mockRequestUrlRejected(new Error('Network Error'));
                const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

                const handler = new ImageHandler(makePluginMock() as never);
                const noteFile = makeTFileMock("Notes/Test.md") as never;
                const document = new DOMParser().parseFromString(APP_URL_HTML, "text/html");

                await handler.fetchImages(document, "https://mock.sample.foo/", noteFile);

                expect(consoleSpy).toHaveBeenCalled();
                expect(consoleSpy).toHaveBeenCalledWith("[image] Image fetch failed:", "app://mock.sample.com/media/photo.png", Error('Network Error'));
            });

            it("continues processing remaining images after a failure", async () => {
                const sourceHTML = BAD_SRC_HTML;
                const buffer = new ArrayBuffer(0);
                mockRequestUrlResolved({
                    text: sourceHTML,
                    arrayBuffer: buffer
                });
                
                urlSpy();
                const plugin = makePluginMock();
                const handler = new ImageHandler(plugin as never);
                const noteFile = makeTFileMock("Notes/Test.md") as never;
                const document = new DOMParser().parseFromString(sourceHTML, "text/html");
                
                await handler.fetchImages(document, "https://mock.sample.foo/", noteFile);
                
                const imgSrcs = Array.from(document.querySelectorAll("img"))
                                    .map((img) => img.getAttribute("src")).filter(Boolean);

                expect(imgSrcs).toEqual(
                    expect.arrayContaining(
                        ["Notes/Attachments/real.png"]
                    )
                );
                expect(plugin.app.vault.adapter.writeBinary)
                    .toHaveBeenCalledWith('Notes/Attachments/real.png', buffer); 
            });
            it("handles notes with no parent directory by using workspace Attachments path", async () => {
                const sourceHTML = APP_URL_HTML;
                const buffer = new ArrayBuffer(0);
                mockRequestUrlResolved({
                    text: sourceHTML,
                    arrayBuffer: buffer
                });

                const plugin = makePluginMock();
                const handler = new ImageHandler(plugin as never);
                const noteFile = makeTFileMock("Test.md") as never;
                const document = new DOMParser().parseFromString(sourceHTML, "text/html");
                
                await handler.fetchImages(document, "https://mock.sample.foo/", noteFile);

                expect(plugin.app.vault.adapter.writeBinary)
                    .toHaveBeenCalledWith('Attachments/photo.png', buffer);
            });
        });
	});
});
