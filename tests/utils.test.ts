import {
	normalizeAppUrl,
	sanitizeFilename,
	absolutizeFragmentHrefs,
    setDocUrlForReadability
} from "../src/utils";

describe("utils", () => {
	describe("normalizeAppUrl", () => {
		it("converts app://obsidian.md links to page origin", () => {
			const pageUrl = "https://example.com/post";
			const value = "app://obsidian.md/images/pic.png";

			expect(normalizeAppUrl(value, pageUrl)).toBe(
				"https://example.com/images/pic.png"
			);
		});
	});

	describe("sanitizeFilename", () => {
		it("replaces unsafe filename characters", () => {
			expect(sanitizeFilename('my <bad> file?.png')).toBe("my__bad__file_.png");
		});
	});

	describe("absolutizeFragmentHrefs", () => {
		it("converts fragment-only anchor links to absolute URLs", () => {
			document.body.innerHTML =
				'<a id="x" href="#section-1">jump</a><a href="https://x.dev">keep</a>';

			absolutizeFragmentHrefs(document, "https://site.dev/article");

			const links = Array.from(document.querySelectorAll("a"));
			expect(links[0]?.getAttribute("href")).toBe(
				"https://site.dev/article#section-1"
			);
			expect(links[1]?.getAttribute("href")).toBe("https://x.dev");
		});
	});

    describe("setDocUrlForReadability", () => {
		it("mutates a document-like object's URL fields", () => {
			const doc = {} as Document;
			const url = "https://example.com/post";

			setDocUrlForReadability(doc, url);

			expect((doc as unknown as { URL?: string }).URL).toBe(url);
			expect((doc as unknown as { documentURI?: string }).documentURI).toBe(url);
			expect((doc as unknown as { baseURI?: string }).baseURI).toBe(url);
		});
    });
});
