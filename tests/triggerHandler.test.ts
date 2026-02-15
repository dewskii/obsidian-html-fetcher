import { TriggerHandler } from "../src/triggerHandler";
import { HtmlHandler } from "../src/htmlHandler";
import { makeEditorMock, makePluginMock } from "./mocks/obsidian";


describe("TriggerHandler", () => {
	describe("editorTrigger", () => {
		it("replaces a valid trigger line with fetched markdown", async () => {
            
        });

		it("does nothing when the previous line is not a trigger", async () => {
			const plugin = makePluginMock();
			const editor = makeEditorMock();

			const handler = new TriggerHandler(plugin as never);

			await handler.editorTrigger(editor as never);

			expect(editor.setLine).not.toHaveBeenCalled();
			expect(editor.replaceRange).not.toHaveBeenCalled();
		});

        it("writes an error marker when fetch fails", async () => {
            muteConsoleError();

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
		it.todo("processes all trigger lines in order on file open");

		it.todo("leaves trigger line as error text when a single fetch fails");

		it.todo("modifies file only when at least one trigger succeeds");
        
		it.todo("deduplicates in-flight file-open requests");
	});

	describe("getTriggerRegex", () => {
		it.todo("matches lines in the format: [!html-fetch] <url>");
	});
});
