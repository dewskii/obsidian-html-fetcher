import { requestUrl, TFile } from "obsidian";
import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import { ImageHandler } from "./imageHandler";
import { getTurnDownService, registerImageRule, registerTableRule } from './turndownRules';
import {
	absolutizeFragmentHrefs,
	setDocUrlForReadability,
	normalizeArticle,
	parseArticleFragment
} from "./utils";
import HtmlFetcherPlugin from "main";

export class HtmlHandler {
	private imageHandler: ImageHandler;

	constructor(private plugin: HtmlFetcherPlugin) {
		this.imageHandler = new ImageHandler(plugin);
	}

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
		//Learned the hardway not to normalize before passing to Readability
		const articleDocument = parseArticleFragment(article.content);
		normalizeArticle(articleDocument, url);

		const fetchImages = this.plugin.settings.fetchImages;
		if(fetchImages) {
			await this.localizeArticleImages(articleDocument, url, noteFile);
		}
		const turndown = getTurnDownService();

		if (fetchImages) {
			registerImageRule(turndown);
		}
		registerTableRule(turndown);

		//Need to bring it back to a fragment before conversion
		const cleanedHtml = articleDocument.body?.innerHTML ?? "";

		const rawTitle = article.title;
		const title = `# ${rawTitle}`;

		const body = turndown.turndown(cleanedHtml).trim();

		const host = new URL(url).host;

		return `${title}\n\n[${host}](${url})\n\n---\n\n${body}\n`;
	}

	private async localizeArticleImages(
		document: Document,
		pageUrl: string,
		noteFile: TFile
	): Promise<void> {
		await this.imageHandler.fetchImages(document, pageUrl, noteFile);
	}
}
