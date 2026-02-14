import { Editor, TFile, Notice, MarkdownView, Plugin } from "obsidian";
import { HtmlHandler } from "./htmlHandler";

// [!html-fetch] https://some.url/
const TRIGGER_RE = /^\[!html-fetch\]\s+(\S+)\s*$/i;

export class TriggerHandler {
	private inFlight = new Set<string>();
	private HtmlHandler: HtmlHandler;

	constructor(private plugin: Plugin) {
		this.HtmlHandler = new HtmlHandler(plugin);
	}

	getTriggerRegex(): RegExp {
		return TRIGGER_RE;
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

			// Replace the trigger line with the fetched content
			const newContent = md.split("\n");
			for (let i = 0; i < newContent.length; i++) {
				if (i === 0) {
					editor.setLine(lineNo, newContent[i] ?? "");
				} else {
					editor.replaceRange(
						"\n" + (newContent[i] ?? ""),
						{
							line: lineNo + i - 1,
							ch: editor.getLine(lineNo + i - 1).length
						}
					);
				}
			}
			new Notice("HTML fetched.");
		} catch (err) {
			console.error(err);
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
					console.error(err);
					// leave the trigger line as-is if it fails
					lines[i] = `[!html-fetch error] ${String(err)} | ${url}`;
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
