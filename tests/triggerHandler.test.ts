import { TriggerHandler } from "../src/triggerHandler";
import { HtmlHandler } from "../src/htmlHandler";
import { makeEditorMock, makePluginMock, makeTFileMock } from "./mocks/obsidian";


describe("TriggerHandler", () => {
    beforeEach(() => {
        muteConsoleError();
    });

	describe("editorTrigger", () => {
		it("does nothing when there is no active markdown view", async () => {
			const plugin = makePluginMock({ activeViewReturn: {} });
			const editor = makeEditorMock("[!html-fetch] https://example.com");

			const handler = new TriggerHandler(plugin as never);
			await handler.editorTrigger(editor as never);

			expect(editor.setLine).not.toHaveBeenCalled();
			expect(editor.replaceRange).not.toHaveBeenCalled();
		});

		it("does nothing when there's no fetch flag", async () => {
			const plugin = makePluginMock();
			const editor = makeEditorMock();

			const handler = new TriggerHandler(plugin as never);

			await handler.editorTrigger(editor as never);

			expect(editor.setLine).not.toHaveBeenCalled();
			expect(editor.replaceRange).not.toHaveBeenCalled();
		});

		it("replaces a valid trigger line with fetched markdown", async () => {
			jest
				.spyOn(HtmlHandler.prototype, "fetchToMarkdown")
				.mockResolvedValue("# Heading\n\nBody line");

            const plugin = makePluginMock();
			const editor = makeEditorMock("[!html-fetch] https://example.com");

			const handler = new TriggerHandler(plugin as never);

			await handler.editorTrigger(editor as never);

            expect(editor.setLine).toHaveBeenCalled();
			expect(editor.replaceRange).toHaveBeenCalled();
        });

        it("writes an error marker when fetch fails", async () => {
            jest
                .spyOn(HtmlHandler.prototype, "fetchToMarkdown")
                .mockRejectedValue(new Error("Readability failed to extract content."));

            const plugin = makePluginMock();
            const editor = makeEditorMock("[!html-fetch] https://example.com");

            const handler = new TriggerHandler(plugin as never);
            await handler.editorTrigger(editor as never);

            expect(editor.setLine).toHaveBeenCalledWith(
                0,
                expect.stringContaining("[!html-fetch error]")
            );
            expect(editor.setLine).toHaveBeenCalledWith(
                0,
                expect.stringContaining("https://example.com")
            );
        });

		it.todo("deduplicates in-flight editor trigger requests");
	});

	describe("fileOpenTrigger", () => {
		it("processes all trigger lines on file open", async () => {
			jest
				.spyOn(HtmlHandler.prototype, "fetchToMarkdown")
				.mockResolvedValueOnce("# A\n\nBody A\n")
				.mockResolvedValueOnce("# B\n\nBody B\n");

			const plugin = makePluginMock({
				initialFileContent:
					"[!html-fetch] https://a.dev\nkeep\n[!html-fetch] https://b.dev"
			});
			const file = makeTFileMock("Notes/Test.md");

			const handler = new TriggerHandler(plugin as never);
			await handler.fileOpenTrigger(file as never);

			expect(plugin.app.vault.modify).toHaveBeenCalledTimes(1);
			expect(plugin.app.vault.modify).toHaveBeenCalledWith(
				file,
				"# A\n\nBody A\nkeep\n# B\n\nBody B"
			);
		});

		it("leaves trigger line as error text when fetch fails", async () => {
            jest
				.spyOn(HtmlHandler.prototype, "fetchToMarkdown")
				.mockRejectedValueOnce(new Error("Readability failed to extract content."))

			const plugin = makePluginMock({
				initialFileContent:
					"[!html-fetch] https://example.com\n"
			});
			const file = makeTFileMock("Notes/Test.md");

			const handler = new TriggerHandler(plugin as never);
			await handler.fileOpenTrigger(file as never);

            expect(plugin.app.vault.modify).toHaveBeenCalledTimes(1);
			expect(plugin.app.vault.modify).toHaveBeenCalledWith(
				file,
				"[!html-fetch error] Error: Readability failed to extract content. | https://example.com\n"
			);
        });

		it.todo("modifies file only when at least one trigger succeeds");
        
		it.todo("deduplicates in-flight file-open requests");
	});

	describe("getTriggerRegex", () => {
		it.todo("matches lines in the format: [!html-fetch] <url>");
	});
});
