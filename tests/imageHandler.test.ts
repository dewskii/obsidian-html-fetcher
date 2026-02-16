
import * as utils from "../src/utils";
import { ImageHandler } from "../src/imageHandler";
import { IMAGE_HEAVY_HTML } from "./fixtures/html";
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

                expect(requestUrl).toHaveBeenCalledTimes(2);
                expect(requestUrl).toHaveBeenCalledWith({url: "https://mock.sample.foo/assets/first.jpg"});
                expect(requestUrl).toHaveBeenCalledWith({url: "https://mock.separate.foo/assets/second" });
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
            it.todo("sanitizes unsafe filename characters before writing");
        });

        describe("src mutation", () => {
            it.todo("rewrites img src to local Attachments/<filename> after successful write");
            it.todo("removes srcset after successful localization");
            it.todo("does not mutate src or srcset when a fetch/write fails");
        });

        describe("error handling", () => {
            it.todo("logs a warning and continues when one image fetch fails");
            it.todo("continues processing remaining images after a failure");
            it.todo("handles notes with no parent directory by using workspace Attachments path");
        });
	});
});
