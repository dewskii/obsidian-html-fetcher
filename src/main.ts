import { Plugin, MarkdownView } from "obsidian";
import { TriggerHandler } from "./triggerHandler";

export default class HtmlFetcherPlugin extends Plugin {
	private triggerHandler: TriggerHandler;

	onload() {
		this.triggerHandler = new TriggerHandler(this);

		// Listen for editor changes to handle inline triggers
		this.registerEvent(
			this.app.workspace.on("editor-change", (editor) => {
				void this.triggerHandler.editorTrigger(editor);
			})
		);

		// Listen for file opens to process all triggers
		this.registerEvent(
			this.app.workspace.on("active-leaf-change", (leaf) => {
				const view = leaf?.view;
				if (view instanceof MarkdownView) {
					const file = view.file;
					if (file)
						void this.triggerHandler.fileOpenTrigger(file);
				}
			})
		);
	}
}
