import { Editor, TFile, Notice, MarkdownView } from "obsidian";
import { HtmlHandler } from "./htmlHandler";
import HtmlFetcherPlugin from "main";
import { errorLog } from "./loggers";

// [!html-fetch] https://some.url/
const TRIGGER_RE = /^\[!html-fetch\]\s+(\S+)\s*$/i;

export class TriggerHandler {
	private inFlight = new Set<string>();
	private HtmlHandler: HtmlHandler;
	private toFetchImages: boolean

	constructor(private plugin: HtmlFetcherPlugin) {
		this.HtmlHandler = new HtmlHandler(plugin);
		this.toFetchImages = this.plugin.settings.fetchImages;
	}
	
	async editorTrigger(editor: Editor): Promise<void> {
		const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
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
			const md = await this.HtmlHandler.fetchToMarkdown(url, view.file);

			const replacement = md.trimEnd();
			const currentLineLength = editor.getLine(lineNo).length;
			editor.replaceRange(
				replacement,
				{ line: lineNo, ch: 0 },
				{ line: lineNo, ch: currentLineLength }
			);
			new Notice("HTML fetched.");
		} catch (err) {
			errorLog("trigger", "Editor fetch failed", err);
			editor.setLine(
				lineNo,
				`[!html-fetch error] ${String(err)} | ${url}`
			);
			new Notice(`HTML fetch failed: ${String(err)}`);
		} finally {
			this.inFlight.delete(key);
		}
	}

	async fileOpenTrigger(file: TFile): Promise<void> {
		// dedupe
		const key = `${file.path}:open`;
		if (this.inFlight.has(key)) return;
		this.inFlight.add(key);

		try {
			const original = await this.plugin.app.vault.read(file);

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
					const md = await this.HtmlHandler.fetchToMarkdown(url, file);
					const mdLines = md.trimEnd().split("\n");

					lines.splice(i, 1, ...mdLines);
					i += mdLines.length - 1;
					changed = true;
				} catch (err) {
					errorLog("trigger", "File-open fetch failed", err, { url, line: i });
					// Write the error
					lines[i] = `[!html-fetch error] ${String(err)} | ${url}`;
					changed = true;
				}
			}

			if (changed) {
				await this.plugin.app.vault.modify(file, lines.join("\n"));
				new Notice("HTML fetch processed on open.");
			}
		} finally {
			this.inFlight.delete(key);
		}
	}
}
