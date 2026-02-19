import * as utils from "../src/utils";
import { ImageHandler } from "../src/imageHandler";
import  * as fixture from "./helpers/fixtures/html";
import {
	mockRequestUrlResolved,
	resetRequestUrlMock,
    requestUrl,
    mockRequestUrlRejected,
    resetNormalizePathMock
} from './helpers/mocks/obsidian'
import { mockSuite } from "./helpers/mocks/pluginGoodies";

describe("ImageHandler", () => {
    beforeEach(() => {
        muteConsoleError();
		resetRequestUrlMock();
    });

	describe("fetchImages", () => {
        describe("folder setup", () => {
            it("creates an Attachments folder when missing", async () => {
                const sourceHTML = fixture.APP_URL_HTML;
                const buffer = new ArrayBuffer(0);
                mockRequestUrlResolved({
                    text: sourceHTML,
                    arrayBuffer: buffer
                })

                const { plugin, handler, noteFile, document } = mockSuite(
                    ImageHandler,
                    sourceHTML
                );

                await handler.fetchImages(document, "https://mock.sample.foo/", noteFile);

                expect(plugin.app.vault.createFolder).toHaveBeenCalledTimes(1);
                expect(plugin.app.vault.createFolder).toHaveBeenCalledWith("Notes/Attachments");

            });
            it("continues when createFolder throws because folder already exists", async () => {
                const sourceHTML = fixture.APP_URL_HTML;
                const buffer = new ArrayBuffer(0);
                mockRequestUrlResolved({
                    text: sourceHTML,
                    arrayBuffer: buffer
                })

                const { plugin, handler, noteFile, document } = mockSuite(
                    ImageHandler,
                    sourceHTML
                );
                
                //kinda seems hacky, requestUrl would only get called if ensureFolder continues
                plugin.app.vault.createFolder = jest.fn().mockRejectedValueOnce(new Error());

                await handler.fetchImages(document, "https://mock.sample.foo/", noteFile);
                
                expect(requestUrl).toHaveBeenCalled();


            });
            it("creates and writes to the attachmentFolderPath if set in settings", async () => {
                const sourceHTML = fixture.APP_URL_HTML;
                const buffer = new ArrayBuffer(0);
                mockRequestUrlResolved({
                    text: sourceHTML,
                    arrayBuffer: buffer
                })

                const { plugin, handler, noteFile, document } = mockSuite(
                    ImageHandler,
                    sourceHTML
                );
                
                plugin.settings.attachmentFolderPath = 'MyResources/Images'

                await handler.fetchImages(document, "https://mock.sample.foo/", noteFile);

                expect(plugin.app.vault.adapter.writeBinary).toHaveBeenCalledWith('MyResources/Images/photo.png', buffer)
            });
        });

        describe("image selection and URL resolution", () => {
            it("skips img elements with no src attribute", async () => {
                const sourceHTML = fixture.SPARSE_SRC_HTML;
                const buffer = new ArrayBuffer(0);
                mockRequestUrlResolved({
                    text: sourceHTML,
                    arrayBuffer: buffer
                })

                const { handler, noteFile, document } = mockSuite(
                    ImageHandler,
                    sourceHTML
                );

                await handler.fetchImages(document, "https://mock.sample.foo/", noteFile);

                expect(requestUrl).toHaveBeenCalledTimes(1);
                expect(requestUrl).toHaveBeenCalledWith({url: "https://mock.sample.com/media/real.png"});
            });

            it("skips invalid image src values that cannot form a URL", async () => {
                const sourceHTML = fixture.BAD_SRC_HTML;
                const buffer = new ArrayBuffer(0);
                mockRequestUrlResolved({
                    text: sourceHTML,
                    arrayBuffer: buffer
                });

                urlSpy();

                const { handler, noteFile, document } = mockSuite(
                    ImageHandler,
                    sourceHTML
                );

                await handler.fetchImages(document, "https://mock.sample.foo/", noteFile);
                
                expect(requestUrl).toHaveBeenCalledTimes(1);
                expect(requestUrl).toHaveBeenCalledWith({url: "https://mock.sample.com/media/real.png"});
            });
        });

        describe("download and write flow", () => {
            it("requests each image using the computed absolute URL", async () => {
                const sourceHTML = fixture.IMAGE_HEAVY_HTML
                const buffer = new ArrayBuffer(0);
                mockRequestUrlResolved({
                    text: sourceHTML,
                    arrayBuffer: buffer
                });

                const { handler, noteFile, document } = mockSuite(
                    ImageHandler,
                    sourceHTML
                );

                await handler.fetchImages(document, "https://mock.sample.foo/", noteFile);

                expect(requestUrl).toHaveBeenCalledTimes(3);
                expect(requestUrl).toHaveBeenCalledWith({url: "https://mock.sample.foo/assets/first.jpg"});
                expect(requestUrl).toHaveBeenCalledWith({url: "https://mock.separate.foo/assets/second" });
                expect(requestUrl).toHaveBeenCalledWith({url: "https://mock.sample.foo/assets/third-250.png"});
            });

            it("adds .img extension when URL filename has no extension", async () => {
                const buffer = new ArrayBuffer(0);
                const sourceHTML = fixture.IMAGE_HEAVY_HTML
                mockRequestUrlResolved({
                    text: sourceHTML,
                    arrayBuffer: buffer
                });

                const { plugin, handler, noteFile, document } = mockSuite(
                    ImageHandler,
                    sourceHTML
                );
                const sanitizes = jest.spyOn(utils, "sanitizeFilename");
                
                await handler.fetchImages(document, "https://mock.sample.foo/", noteFile);

                expect(plugin.app.vault.adapter.writeBinary)
                    .toHaveBeenCalledWith("Notes/Attachments/second.img", buffer);

                expect(sanitizes).toHaveBeenCalledWith("second.img");

            });
            it("sanitizes unsafe filename characters before writing", async () => {
                const sourceHTML = fixture.UNSAFE_FILENAME_IMAGE_HTML;
                const buffer = new ArrayBuffer(0)
                mockRequestUrlResolved({
                    text: sourceHTML,
                    arrayBuffer: buffer
                });

                const { plugin, handler, noteFile, document } = mockSuite(
                    ImageHandler,
                    sourceHTML
                );
                const sanitizes = jest.spyOn(utils, "sanitizeFilename");
                
                await handler.fetchImages(document, "https://mock.sample.foo/", noteFile);
                
                expect(sanitizes).toHaveBeenCalledWith("unsafe%3Cname%3E:bad.img");
                expect(plugin.app.vault.adapter.writeBinary)
                    .toHaveBeenCalledWith("Notes/Attachments/unsafe<name>_bad.img", buffer)

            });
        });

        describe("src mutation", () => {
            it("rewrites img src to local Attachments/<filename> after successful write", async () => {
                const sourceHTML = fixture.IMAGE_HEAVY_HTML
                const buffer = new ArrayBuffer(0);
                mockRequestUrlResolved({
                    text: sourceHTML,
                    arrayBuffer: buffer
                });

                const { handler, noteFile, document } = mockSuite(
                    ImageHandler,
                    sourceHTML
                );
                
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
                const sourceHTML = fixture.IMAGE_HEAVY_HTML;
                const buffer = new ArrayBuffer(0);
                mockRequestUrlResolved({
                    text: sourceHTML,
                    arrayBuffer: buffer
                });
                const { handler, noteFile, document } = mockSuite(
                    ImageHandler,
                    sourceHTML
                );
                
                await handler.fetchImages(document, "https://mock.sample.foo/", noteFile);
                
                const imgSrcs = Array.from(document.querySelectorAll("img"))
                                    .map((img) => img.getAttribute("srcset")).filter(Boolean);
                
                expect(imgSrcs.length).toBe(0);

            });

            it("rewrites linked image href to localized image path", async () => {
                const sourceHTML = fixture.IMAGE_HEAVY_HTML;
                const buffer = new ArrayBuffer(0);
                mockRequestUrlResolved({
                    text: sourceHTML,
                    arrayBuffer: buffer
                });

                const { handler, noteFile, document } = mockSuite(
                    ImageHandler,
                    sourceHTML
                );

                await handler.fetchImages(document, "https://mock.sample.foo/", noteFile);

                const linkedImageHref = document.querySelector("a > img")?.parentElement?.getAttribute("href");
                expect(linkedImageHref).toBe("Notes/Attachments/first.jpg");
            });

            it("removes href when a linked image src remains remote after localization attempt", async () => {
                const sourceHTML = fixture.BAD_HREF_MISMATCH;

                mockRequestUrlRejected(new Error("Network Error"));

                const { handler, noteFile, document } = mockSuite(
                    ImageHandler,
                    sourceHTML
                );

                await handler.fetchImages(document, "https://mock.sample.foo/", noteFile);

                const link = document.querySelector("a");
                expect(link?.getAttribute("href")).toBeNull();
            });

            it("removes href when linked image exists but src attribute is missing", async () => {
                const sourceHTML = fixture.BAD_HREF_HTML;

                urlSpy();
                const buffer = new ArrayBuffer(0);
                mockRequestUrlResolved({ text: sourceHTML, arrayBuffer: buffer });

                const { handler, noteFile, document } = mockSuite(
                    ImageHandler,
                    sourceHTML
                );

                await handler.fetchImages(document, "https://mock.sample.foo/", noteFile);

                const link = document.querySelector("a");
                expect(link?.getAttribute("href")).toBeNull();
            });
        });

        describe("error handling", () => {
            beforeEach(() => {
                resetNormalizePathMock();
            });
            it("logs a warning and continues when one image fetch fails", async () => {
                mockRequestUrlRejected(new Error('Network Error'));
                const consoleSpy = muteConsoleWarn();

                const { handler, noteFile, document } = mockSuite(
                    ImageHandler,
                    fixture.APP_URL_HTML
                );

                await handler.fetchImages(document, "https://mock.sample.foo/", noteFile);

                expect(consoleSpy).toHaveBeenCalled();
                expect(consoleSpy).toHaveBeenCalledWith("[image] Image fetch failed:", "app://mock.sample.com/media/photo.png", Error('Network Error'));
            });

            it("continues processing remaining images after a failure", async () => {
                const sourceHTML = fixture.BAD_SRC_HTML;
                const buffer = new ArrayBuffer(0);
                mockRequestUrlResolved({
                    text: sourceHTML,
                    arrayBuffer: buffer
                });
                
                urlSpy();
                const { plugin, handler, noteFile, document } = mockSuite(
                    ImageHandler,
                    sourceHTML
                );
                
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
                const sourceHTML = fixture.APP_URL_HTML;
                const buffer = new ArrayBuffer(0);
                mockRequestUrlResolved({
                    text: sourceHTML,
                    arrayBuffer: buffer
                });

                const { plugin, handler, noteFile, document } = mockSuite(
                    ImageHandler,
                    sourceHTML,
                    { notePath: "Test.md" }
                );
                
                await handler.fetchImages(document, "https://mock.sample.foo/", noteFile);

                expect(plugin.app.vault.adapter.writeBinary)
                    .toHaveBeenCalledWith('Attachments/photo.png', buffer);
            });
        });
	});
});
