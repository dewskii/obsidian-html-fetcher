import { requestUrl, normalizePath, Plugin } from "obsidian";
import { TFile } from "obsidian";
import { sanitizeFilename } from "./utils";

//TODO: move this to plugin settings
const DEFAULT_ATTACHEMENTS_DIR = 'Attachments'

export class ImageHandler {
	constructor(private plugin: Plugin) {}

	async fetchImages(
		document: Document,
		pageUrl: string,
		noteFile: TFile
	): Promise<void> {
		const noteDir = noteFile.parent?.path ?? "";

		const attachmentsDir = normalizePath(noteDir ? `${noteDir}/${DEFAULT_ATTACHEMENTS_DIR}` : DEFAULT_ATTACHEMENTS_DIR);
		await this.ensureFolder(attachmentsDir);

		const imgs = Array.from(document.querySelectorAll("img"));
		for (const img of imgs) {
			const src = img.getAttribute("src");
			if (!src) continue;

			let abs: string;
			try {
				abs = new URL(src, pageUrl).toString();
			} catch {
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
				const localPath = normalizePath(noteDir ? `${attachmentsDir}/${name}`: `${DEFAULT_ATTACHEMENTS_DIR}/${name}`);

				await this.plugin.app.vault.adapter.writeBinary(localPath, bytes);

				img.setAttribute("src", `Attachments/${name}`);
				img.removeAttribute("srcset");
			} catch (e) {
				console.warn("Image fetch failed:", abs, e);
			}
		}
	}

	private async ensureFolder(path: string): Promise<void> {
		try {
			await this.plugin.app.vault.createFolder(path);
		} catch {
			// exists
		}
	}
}
