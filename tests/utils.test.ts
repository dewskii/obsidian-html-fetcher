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

		it("returns original sanitized text when decodeURIComponent throws", () => {
			expect(sanitizeFilename("bad%E0%A4%A.png")).toBe("bad%E0%A4%A.png");
		});
        
	});

	describe("absolutizeFragmentHrefs", () => {
		it("converts fragment-only anchor links to absolute URLs", () => {
            //Creating elements directly to appease the linter
            
            // <a id="x" href="#section-1">jump</a>
            const fragment = document.createElement("a");
            fragment.id = "x";
            fragment.setAttribute("href", "#section-1");
            fragment.textContent = "Jump"
            
            // <a href="https://x.dev">keep</a>
            const absolute = document.createElement("a");
            absolute.setAttribute("href", "https://x.dev");
            absolute.textContent = "Keep";
            
            document.body.replaceChildren(fragment, absolute);

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
