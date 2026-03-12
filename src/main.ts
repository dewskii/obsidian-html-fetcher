import { MarkdownView, Plugin } from "obsidian";
import { DEFAULT_SETTINGS, type HtmlFetcherSettings, HtmlFetcherSettingsTab } from "settings";
import { debugLog } from "./loggers";
import { TriggerHandler } from "./triggerHandler";

export default class HtmlFetcherPlugin extends Plugin {
	private triggerHandler!: TriggerHandler;
	settings!: HtmlFetcherSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new HtmlFetcherSettingsTab(this.app, this));

		this.triggerHandler = new TriggerHandler(this);

		this.registerEvent(
			this.app.workspace.on("editor-change", (editor) => {
				void this.triggerHandler.editorTrigger(editor);
				debugLog(this.settings, "Editor trigger enabled");
			}),
		);

		this.registerEvent(
			this.app.workspace.on("active-leaf-change", (leaf) => {
				const view = leaf?.view;
				if (view instanceof MarkdownView) {
					const file = view.file;
					if (file) {
						void this.triggerHandler.fileOpenTrigger(file);
						debugLog(this.settings, "Active leaf trigger enabled");
					}
				}
			}),
		);
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<HtmlFetcherSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
