import { TriggerHandler } from "../src/triggerHandler";
import { HtmlHandler } from "../src/htmlHandler";
import { makeEditorMock, makePluginMock, makeTFileMock } from "./helpers/mocks/obsidian";

describe("TriggerHandler", () => {
    beforeEach(() => {
        muteConsoleError();
    });

	describe("editorTrigger", () => {
		it.todo("returns early when cursor is on the first line (line 0)");
		
		it.todo("returns early when previous line does not match trigger regex");

		it("does nothing when there is no active markdown view", async () => {
			const plugin = makePluginMock({ activeViewReturn: {} });
			const editor = makeEditorMock("[!html-fetch] https://mock.sample.foo/");

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
			const editor = makeEditorMock("[!html-fetch] https://mock.sample.foo/");

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
            const editor = makeEditorMock("[!html-fetch] https://mock.sample.foo/");

            const handler = new TriggerHandler(plugin as never);
            await handler.editorTrigger(editor as never);

            expect(editor.setLine).toHaveBeenCalledWith(
                0,
                expect.stringContaining("[!html-fetch error]")
            );
            expect(editor.setLine).toHaveBeenCalledWith(
                0,
                expect.stringContaining("https://mock.sample.foo/")
            );
        });

		it.todo("deduplicates in-flight editor trigger requests");
	});

	describe("fileOpenTrigger", () => {
		it("does not call vault.modify when file content has no trigger lines", async () => {
			const plugin = makePluginMock({
				initialFileContent: "regular line\nanother line"
			});
			const file = makeTFileMock("Notes/Test.md");

			const handler = new TriggerHandler(plugin as never);
			await handler.fileOpenTrigger(file as never);

			expect(plugin.app.vault.modify).not.toHaveBeenCalled();
		});
		it.todo("skips empty lines while continuing to process valid triggers");

		it("processes all trigger lines on file open", async () => {
			jest
				.spyOn(HtmlHandler.prototype, "fetchToMarkdown")
				.mockResolvedValueOnce("# A\n\nBody A\n")
				.mockResolvedValueOnce("# B\n\nBody B\n");

			const plugin = makePluginMock({
				initialFileContent:
					"[!html-fetch] https://mock.sample.foo/a\nexisting text\n[!html-fetch] https://mock.sample.foo/b"
			});
			const file = makeTFileMock("Notes/Test.md");

			const handler = new TriggerHandler(plugin as never);
			await handler.fileOpenTrigger(file as never);

			expect(plugin.app.vault.modify).toHaveBeenCalledTimes(1);
			expect(plugin.app.vault.modify).toHaveBeenCalledWith(
				file,
				"# A\n\nBody A\nexisting text\n# B\n\nBody B"
			);
		});

		it("leaves trigger line as error text when fetch fails", async () => {
            jest
				.spyOn(HtmlHandler.prototype, "fetchToMarkdown")
				.mockRejectedValueOnce(new Error("Readability failed to extract content."))

			const plugin = makePluginMock({
				initialFileContent:
					"[!html-fetch] https://mock.sample.foo/\n"
			});
			const file = makeTFileMock("Notes/Test.md");

			const handler = new TriggerHandler(plugin as never);
			await handler.fileOpenTrigger(file as never);

            expect(plugin.app.vault.modify).toHaveBeenCalledTimes(1);
			expect(plugin.app.vault.modify).toHaveBeenCalledWith(
				file,
				"[!html-fetch error] Error: Readability failed to extract content. | https://mock.sample.foo/\n"
			);
        });

		it.todo("modifies file only when at least one trigger succeeds");
        
		it.todo("deduplicates in-flight file-open requests");
	});

	describe("getTriggerRegex", () => {
		it.todo("matches lines in the format: [!html-fetch] <url>");
	});
});
