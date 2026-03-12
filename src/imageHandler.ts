import type HtmlFetcherPlugin from "main";
import { normalizePath, requestUrl, type TFile } from "obsidian";
import { debugLog, warnLog } from "./loggers";
import { normalizeHrefs, sanitizeFilename } from "./utils";

const MIME_TO_EXT: Record<string, string> = {
	"image/png": ".png",
	"image/jpeg": ".jpg",
	"image/gif": ".gif",
	"image/webp": ".webp",
	"image/avif": ".avif",
	"image/svg+xml": ".svg",
	"image/bmp": ".bmp",
	"image/tiff": ".tiff",
};

const VALID_IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|svg|bmp|tiff?)$/i;

const PROXY_URL_PARAMS = ["url", "src", "source", "image"];

function extractFilenameFromUrl(urlString: string): string {
	const url = new URL(urlString);

	for (const param of PROXY_URL_PARAMS) {
		const proxyUrl = url.searchParams.get(param);
		if (proxyUrl) {
			try {
				const decoded = new URL(proxyUrl);
				const filename = decoded.pathname.split("/").pop();
				if (filename && filename !== "") return filename;
			} catch {
				const lastSegment = proxyUrl.split("/").pop() || "";
				const cleaned = decodeURIComponent(lastSegment.split("?")[0] as string);
				if (cleaned && cleaned !== "") return cleaned;
			}
		}
	}

	return url.pathname.split("/").pop() || "image";
}

function extractDirectUrl(urlString: string): string {
	try {
		const url = new URL(urlString);

		for (const param of PROXY_URL_PARAMS) {
			const proxyUrl = url.searchParams.get(param);
			if (!proxyUrl) continue;

			try {
				new URL(proxyUrl);
				return proxyUrl;
			} catch {
				// If proxyUrl is not a valid URL, skip it and continue checking others
				continue;
			}
		}
	} catch {
		// If urlString is not a valid URL, fall back to returning it as-is
	}

	return urlString;
}

export class ImageHandler {
	constructor(private plugin: HtmlFetcherPlugin) {}

	async fetchImages(document: Document, pageUrl: string, noteFile: TFile): Promise<void> {
		debugLog(this.plugin.settings, `fetchImages called for: ${pageUrl}`);
		const attachmentsDirectory = this.buildPath(noteFile);
		await this.ensureFolder(attachmentsDirectory);

		const imgs = Array.from(document.querySelectorAll("img"));
		debugLog(this.plugin.settings, `Found ${imgs.length} img elements`);

		for (const img of imgs) {
			const src = img.getAttribute("src");
			debugLog(this.plugin.settings, `img src: ${src}`);
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
				const fetchUrl = extractDirectUrl(abs);
				debugLog(
					this.plugin.settings,
					`Fetching image: ${fetchUrl}${fetchUrl !== abs ? ` (from proxy: ${abs})` : ""}`,
				);
				const r = await requestUrl({
					url: fetchUrl,
				});
				const bytes = r.arrayBuffer;
				debugLog(
					this.plugin.settings,
					`Fetched ${bytes.byteLength} bytes, content-type: ${r.headers["content-type"]}`,
				);

				const fromUrl = extractFilenameFromUrl(abs);
				debugLog(this.plugin.settings, `Extracted filename: ${fromUrl}`);
				const hasValidExt = VALID_IMAGE_EXT.test(fromUrl);

				let name: string;
				if (hasValidExt) {
					name = sanitizeFilename(fromUrl);
				} else {
					const contentType = r.headers["content-type"]?.split(";")[0]?.trim();
					const ext = MIME_TO_EXT[contentType ?? ""] || ".png";
					name = sanitizeFilename(`${fromUrl}${ext}`);
				}

				const localPath = normalizePath(`${attachmentsDirectory}/${name}`);

				await this.plugin.app.vault.adapter.writeBinary(localPath, bytes);

				img.removeAttribute("srcset");
				const encodedPath = `${attachmentsDirectory}/${name}`.replace(/ /g, "%20");
				img.setAttribute("src", encodedPath);
			} catch (e) {
				warnLog("image", "Image fetch failed:", abs, e);
			}
		}

		normalizeHrefs(document);
	}

	private async ensureFolder(path: string): Promise<void> {
		try {
			await this.plugin.app.vault.createFolder(path);
		} catch {
			debugLog(this.plugin.settings, `${path} already exists`);
		}
	}

	private buildPath(noteFile: TFile): string {
		const attachmentFolderSetting = this.plugin.settings.attachmentFolderPath
			.trim()
			.replace(/^\/+/, "");
		const defaultAttachmentFolderPath = this.plugin.settings.defaultAttachmentFolderPath
			.trim()
			.replace(/^\/+/, "");

		if (attachmentFolderSetting) {
			return normalizePath(attachmentFolderSetting);
		}

		if (this.plugin.settings.useNoteFolder) {
			const noteDirectory = noteFile.parent?.path ?? "";
			return normalizePath(
				noteDirectory
					? `${noteDirectory}/${defaultAttachmentFolderPath}`
					: defaultAttachmentFolderPath,
			);
		}

		return normalizePath(defaultAttachmentFolderPath);
	}
}
