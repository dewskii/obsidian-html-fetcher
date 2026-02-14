import { requestUrl, TFile, Plugin } from "obsidian";
import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";
import { parseHTML } from "linkedom";
import {
	absolutizeFragmentHrefs,
	setDocUrlForReadability,
	normalizeAppUrl
} from "./utils";
import { ImageHandler } from "./imageHandler";

export class HtmlHandler {
	private imageHandler: ImageHandler;

	constructor(private plugin: Plugin) {
		this.imageHandler = new ImageHandler(plugin);
	}

	//TODO: integrate with plugin settings to skip image fetch
	async fetchToMarkdown(url: string, noteFile: TFile): Promise<string> {
		const res = await requestUrl({
			url
		});
		const html = res.text;

		const { document } = parseHTML(html);

		setDocUrlForReadability(document, url);
		absolutizeFragmentHrefs(document, url);

		const reader = new Readability(document);
		const article = reader.parse();

		if (!article?.content) {
			throw new Error("Readability failed to extract content.");
		}

		const htmlWithImages = await this.localizeArticle(
			article.content,
			url,
			noteFile,
			true
		);

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

		// handles #like_endpoints
		turndown.addRule("dropBackrefLinks", {
			filter: (node) => {
				if (node.nodeName !== "A") return false;
				const el = node as unknown as HTMLAnchorElement;
				const href = el.getAttribute("href") || "";
				const text = (el.textContent || "").trim();
				return href.startsWith("#") && (text === "^" || text === "↑");
			},
			replacement: () => ""
		});

		const rawTitle = article.title;
		const title = `# ${rawTitle}`;

		const body = turndown.turndown(htmlWithImages).trim();

		const host = new URL(url).host;

		if (!body) {
			throw new Error(
				"Extraction succeeded but produced empty markdown body."
			);
		}

		return `${title}\n\n[${host}](${url})\n\n---\n\n${body}\n`;
	}

	//Remove any relatively linked element and append the url
	private async localizeArticle(
		articleHtml: string,
		pageUrl: string,
		noteFile: TFile,
		fetchImages: boolean = true
	): Promise<string> {
		// articleHtml is a fragment. Wrap it so linkedom puts it in <body>.
		const wrapped = `<html><body>${articleHtml}</body></html>`;
		const { document } = parseHTML(wrapped);

		for (const el of Array.from(document.body.querySelectorAll("*"))) {
			for (const attr of Array.from(el.attributes)) {
				const v = attr.value;
				if (!v || !v.startsWith("app://")) continue;
				el.setAttribute(attr.name, normalizeAppUrl(v, pageUrl));
			}
		}

		if (fetchImages) {
			await this.imageHandler.fetchImages(document, pageUrl, noteFile);
		}

		return document.body?.innerHTML ?? "";
	}
}
