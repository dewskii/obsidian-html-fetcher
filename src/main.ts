import {
	Plugin,
	Editor,
	MarkdownView,
	TFile,
	Notice,
	requestUrl,
	normalizePath
} from "obsidian";

import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";
import { parseHTML } from "linkedom";

const TRIGGER_RE = /^\[!html-fetch\]\s+(\S+)\s*$/i;

export default class HtmlFetcherPlugin extends Plugin {
	private inFlight = new Set<string>();

	onload() {
		this.registerEvent(
			this.app.workspace.on("editor-change", (editor) => {
				void this.maybeHandleTrigger(editor);
			})
		);

		this.registerEvent(
			this.app.workspace.on("active-leaf-change", (leaf) => {
				const view = leaf?.view;
				if (view instanceof MarkdownView) {
					const file = view.file;
					if (file) void this.processFileOnOpen(file);
				}
			})
		);
	}

	private getActiveMarkdownView(): MarkdownView | null {
		return this.app.workspace.getActiveViewOfType(MarkdownView);
	}

	private async maybeHandleTrigger(editor: Editor) {
		const view = this.getActiveMarkdownView();
		if (!view?.file) return;

		const cursor = editor.getCursor();
		if (cursor.line === 0) return;

		const lineNo = cursor.line - 1;
		const line = editor.getLine(lineNo);

		const match = line.match(TRIGGER_RE);
		if (!match) return;

		const url = match[1];
		if (!url) return;

		const key = `${view.file.path}:editor:${lineNo}`;
		if (this.inFlight.has(key)) return;
		this.inFlight.add(key);

		try {
			editor.setLine(lineNo, `Fetching: ${url} …`);
			const md = await this.fetchToMarkdown(url, view.file);

			editor.replaceRange(
				md,
				{ line: lineNo, ch: 0 },
				{ line: lineNo, ch: editor.getLine(lineNo).length }
			);

			new Notice("HTML fetched.");

		} catch (err: any) {

			console.error(err);
			editor.setLine(lineNo, `[!html-fetch] ${url}`);
			new Notice(`HTML fetch failed: ${err?.message ?? String(err)}`);

		} finally {
			this.inFlight.delete(key);
		}
	}

	private async processFileOnOpen(file: TFile) {
		// dedupe
		const key = `${file.path}:open`;
		if (this.inFlight.has(key)) return;
		this.inFlight.add(key);

		try {
			const original = await this.app.vault.read(file);

			const lines = original.split("\n");

			let changed = false;

			for (let i = 0; i < lines.length; i++) {
				const line = lines[i];
				if (!line) continue;
				const m = line.match(TRIGGER_RE);
				if (!m) continue;

				const url = m[1];
				if (!url) continue;

				// If multiple triggers exist, process them in order
				try {
					const md = await this.fetchToMarkdown(url, file);
					lines[i] = md.trimEnd(); // keep file formatting clean
					changed = true;
				} catch (e: any) {
					console.error(e);
					// leave the trigger line as-is if it fails
					lines[i] = `[!html-fetch] ${url}`;
				}
			}

			if (changed) {
				await this.app.vault.modify(file, lines.join("\n"));
				new Notice("HTML fetch processed on open.");
			}
		} finally {
			this.inFlight.delete(key);
		}
	}

	private async fetchToMarkdown(url: string, noteFile: TFile): Promise<string> {
		const res = await requestUrl({
			url
		});
		const html = res.text;

		const {
			document
		} = parseHTML(html);

		try {
			// @ts-expect-error linkedom typing
			document.baseURI = url;
		} catch { 
			//foo
		}

		const reader = new Readability(document as any);
		const article = reader.parse();

		if (!article?.content) {
			throw new Error("Readability failed to extract content.");
		}

		const htmlWithLocalImages = await this.localizeImages(article.content, url, noteFile);

		const turndown = new TurndownService({
			codeBlockStyle: "fenced",
			emDelimiter: "_"
		});

		turndown.addRule("images", {
			filter: "img",
			replacement: (_, node) => {
				const el = node as unknown as HTMLElement;
				const src = el.getAttribute("src") || "";
				const alt = el.getAttribute("alt") || "";
				const title = el.getAttribute("title") || "";
				const titlePart = title ? ` "${title.replace(/"/g, '\\"')}"` : "";
				return src ? `![${alt}](${src}${titlePart})` : "";
			}
		});

		const body = turndown.turndown(htmlWithLocalImages).trim();

		const host = new URL(url).host;

		// If body is empty, make it obvious
		if (!body) {
			throw new Error("Extraction succeeded but produced empty markdown body.");
		}

		return `[${host}](${url})\n\n---\n\n${body}\n`;
	}


	private async localizeImages(
		articleHtml: string,
		pageUrl: string,
		noteFile: TFile
	): Promise<string> {
		// articleHtml is a fragment. Wrap it so linkedom puts it in <body>.
		const wrapped = `<html><body>${articleHtml}</body></html>`;
		const {
			document
		} = parseHTML(wrapped);

		const noteDir = noteFile.parent?.path ?? "";
		const attachmentsDir = normalizePath(`${noteDir}/Attachments`);
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
				const name = sanitizeFilename(fromUrl.includes(".") ? fromUrl : `${fromUrl}.img`);
				const localPath = normalizePath(`${attachmentsDir}/${name}`);

				await this.app.vault.adapter.writeBinary(localPath, bytes);

				img.setAttribute("src", `Attachments/${name}`);
				img.removeAttribute("srcset");
			} catch (e) {
				console.warn("Image fetch failed:", abs, e);
			}
		}

		return document.body?.innerHTML ?? "";
	}


	private async ensureFolder(path: string) {
		try {
			await this.app.vault.createFolder(path);
		} catch {
			//foo
		}
	}
}

function sanitizeFilename(name: string): string {
	return name
		.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
		.replace(/\s+/g, "_")
		.slice(0, 120);
}