export function absolutizeFragmentHrefs(doc: Document, pageUrl: string): void {
	for (const a of Array.from(doc.body.querySelectorAll("a[href^='#']"))) {
		
        const href = a.getAttribute("href");
		if (!href) continue;

		a.setAttribute("href", new URL(href, pageUrl).toString());
	}
}

export function setDocUrlForReadability(doc: Document, url: string): void {
	const anyDoc = doc as unknown as {
		URL?: string;
		documentURI?: string;
		baseURI?: string;
	};

	anyDoc.URL = url;
	anyDoc.documentURI = url;
	anyDoc.baseURI = url;
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
