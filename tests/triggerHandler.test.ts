import { TriggerHandler } from "../src/triggerHandler";

describe("TriggerHandler", () => {
	describe("editorTrigger", () => {
		it.todo("replaces a valid trigger line with fetched markdown");

		it.todo("does nothing when the previous line is not a trigger");

		it.todo("writes an error marker when fetch fails");

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
