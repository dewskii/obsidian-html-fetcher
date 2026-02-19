import { parseHTML } from "linkedom";

//makes testing easier
type ReadabilityUrlDocument = Document & {
	URL: string;
	documentURI: string;
	baseURI: string;
};

function setRDocField(
	doc: ReadabilityUrlDocument,
	key: "URL" | "documentURI" | "baseURI",
	url: string
): void {
	try {
		doc[key] = url;
	} catch {
		//food
	}
}

export function absolutizeFragmentHrefs(doc: Document, pageUrl: string): void {
	for (const a of Array.from(doc.body.querySelectorAll("a[href^='#']"))) {
		const href = a.getAttribute("href");
		if (!href) continue;
		a.setAttribute("href", new URL(href, pageUrl).toString());
	}
}

export function setDocUrlForReadability(doc: Document, url: string): void {
	const readabilityDoc = doc as ReadabilityUrlDocument;

	setRDocField(readabilityDoc, "URL", url);
	setRDocField(readabilityDoc, "documentURI", url);
	setRDocField(readabilityDoc, "baseURI", url);
}

export function normalizeAppUrl(value: string, pageUrl: string): string {
	if (!value.startsWith("app://")) return value;


	if (value.startsWith("app://obsidian.md/")) {
		const origin = new URL(pageUrl).origin;
		return origin + value.slice("app://obsidian.md".length);
	}


	return "https://" + value.slice("app://".length);
}

export function sanitizeFilename(name: string): string {
	const toDecode = name
		.replace(/[<>:"/\\|?*]/g, "_")
		.replace(/\s+/g, "_")
		.slice(0, 120);
	try {
		return decodeURIComponent(toDecode);
	} catch {
		return toDecode;
	}
}

export function parseArticleFragment(articleHtml: string): Document {
	const wrapped = `<html><body>${articleHtml}</body></html>`;
	const { document } = parseHTML(wrapped);
	return document;
}

export function normalizeArticle(doc: Document, pageUrl: string): void {
	const document = doc;
	for (const el of Array.from(document.body.querySelectorAll("*"))) {
		for (const attr of Array.from(el.attributes)) {
			const v = attr.value;
			if (!v || !v.startsWith("app://")) continue;
			el.setAttribute(attr.name, normalizeAppUrl(v, pageUrl));
		}
	}
}

export function isRemoteUrl(value: string): boolean {
		return /^https?:\/\//i.test(value) || /^app:\/\//i.test(value);
}

export function normalizeHrefs(document: Document): void {
		const imageLinks = Array.from(document.querySelectorAll("a[href]"));

		for (const link of imageLinks) {
			const img = link.querySelector("img");
			if (!img) continue;

			const src = img.getAttribute("src");
			if (!src || isRemoteUrl(src)) {
				link.removeAttribute("href");
				continue;
			}

			link.setAttribute("href", src);
		}
}

