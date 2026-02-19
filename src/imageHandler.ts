import { requestUrl, normalizePath } from "obsidian";
import { TFile } from "obsidian";
import { sanitizeFilename } from "./utils";
import HtmlFetcherPlugin from "main";
import { debugLog, warnLog } from "./loggers";

export class ImageHandler {
	constructor(private plugin: HtmlFetcherPlugin) {}

	async fetchImages(
		document: Document,
		pageUrl: string,
		noteFile: TFile
	): Promise<void> {

		const attachmentsDirectory = this.buildPath(noteFile);
		await this.ensureFolder(attachmentsDirectory);

		const imgs = Array.from(document.querySelectorAll("img"));
		for (const img of imgs) {
			const src = img.getAttribute("src");
			if (!src) continue;

			let abs: string;
			try {
				abs = new URL(src, pageUrl).toString();
			} catch {
				img.removeAttribute("src");
				img.removeAttribute("srcset");
				continue;
			}

			try {
				const r = await requestUrl({
					url: abs
				});
				const bytes = r.arrayBuffer;

				const fromUrl = new URL(abs).pathname.split("/").pop() || "image";
				const name = sanitizeFilename(
					fromUrl.includes(".") ? fromUrl : `${fromUrl}.img`
				);
				const localPath = normalizePath(`${attachmentsDirectory}/${name}`);

				await this.plugin.app.vault.adapter.writeBinary(localPath, bytes);
				
				img.removeAttribute("srcset");
				img.setAttribute("src", `${attachmentsDirectory}/${name}`);

			} catch (e) {
				warnLog("image", "Image fetch failed:", abs, e);
			}
		}

		this.normalizeHrefs(document);
	}

	private normalizeHrefs(document: Document): void {
		const imageLinks = Array.from(document.querySelectorAll("a[href]"));

		for (const link of imageLinks) {
			const img = link.querySelector("img");
			if (!img) continue;

			const src = img.getAttribute("src");
			if (!src || this.isRemoteUrl(src)) {
				link.removeAttribute("href");
				continue;
			}

			link.setAttribute("href", src);
		}
	}

	private isRemoteUrl(value: string): boolean {
		return /^https?:\/\//i.test(value) || /^app:\/\//i.test(value);
	}

	private async ensureFolder(path: string): Promise<void> {
		try {
			await this.plugin.app.vault.createFolder(path);
		} catch {
			debugLog(this.plugin.settings, `${path} already exists`);
		}
	}

	private buildPath(noteFile: TFile): string {
		const noteDirectory= noteFile.parent?.path ?? "";
		const attachmentFolderSetting = this.plugin.settings.attachmentFolderPath.trim().replace(/^\/+/, "");
		const defaultAttachmentFolderPath = this.plugin.settings.defaultAttachmentFolderPath.trim().replace(/^\/+/, "");
		
		const attachmentDirectory = attachmentFolderSetting 
									? attachmentFolderSetting
									: noteDirectory 
										? `${noteDirectory}/${defaultAttachmentFolderPath}` 
										: defaultAttachmentFolderPath;
									

		return normalizePath(attachmentDirectory);	
	}
}