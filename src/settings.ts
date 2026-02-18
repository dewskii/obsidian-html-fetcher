import {App, PluginSettingTab, Setting, SettingGroup} from "obsidian";
import HtmlFetcherPlugin from "./main";

export interface HtmlFetcherSettings {
    defaultAttachmentFolderPath: string;
    attachmentFolderPath: string;
    useNoteFolder: boolean;
	fetchImages: boolean;
    debug: boolean;
}

export const DEFAULT_SETTINGS: HtmlFetcherSettings = {
    defaultAttachmentFolderPath: 'Attachments',
    attachmentFolderPath: '',
    useNoteFolder: true,
	fetchImages: true,
    debug: false
}

export class HtmlFetcherSettingsTab extends PluginSettingTab {
	plugin: HtmlFetcherPlugin;

	constructor(app: App, plugin: HtmlFetcherPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

        new SettingGroup(containerEl)
            .setHeading('HTML Fetcher Settings')
            .addSetting((setting: Setting) => {
                setting
                .setName('Attachment folder path')
                .setDesc('Set a default attachments folder, defaults to article note\'s folder')
                .addText((text) =>
                    text
                    .setPlaceholder('Attachments')
                    .setValue(this.plugin.settings.attachmentFolderPath)
                    .onChange(async (value) => {
                        this.plugin.settings.attachmentFolderPath = value;
                        await this.plugin.saveSettings();
                    })
                );
            })
            .addSetting((setting: Setting) => {
                setting
                .setName('Image downloads')
                .setDesc('Save embedded images locally and reference them in the note, turn off to use external image links instead.')
                .addToggle(toggle => toggle.setValue(this.plugin.settings.fetchImages)
                    .onChange(async (value) => {
                        this.plugin.settings.fetchImages = value;
                        await this.plugin.saveSettings();
                    })
                );
            })
            .addSetting((setting: Setting) => {
                setting
                .setName('Debug mode')
                .setDesc('Show debug logs in the console')
                .addToggle(toggle => toggle.setValue(this.plugin.settings.debug)
                    .onChange(async (value) => {
                        this.plugin.settings.debug = value;
                        await this.plugin.saveSettings();
                    })
                );
            })
    }
}