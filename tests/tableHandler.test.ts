import TurndownService from "turndown";
import { registerTableRule, getTurnDownService } from "../src/turndownRules";
import { COMPLEX_TABLE, LTX_EQN_TABLE, SIMPLE_TABLE } from "./helpers/fixtures/html";

function buildTurndown(): TurndownService {
	const turndown = getTurnDownService();
	registerTableRule(turndown);
	return turndown;
}

describe("tableHandler", () => {
	it("converts simple tables to markdown", () => {
		const turndown = buildTurndown();
		const html = SIMPLE_TABLE;

		const markdown = turndown.turndown(html);

		expect(markdown).toContain("| Col A | Col B |");
		expect(markdown).toContain("| --- | --- |");
		expect(markdown).toContain("| One | Two |");
	});

	it("keeps complex tables as cleaned HTML when colspan or rowspan exists", () => {
		const turndown = buildTurndown();
		const html = COMPLEX_TABLE;

		const markdown = turndown.turndown(html);

		expect(markdown).toContain("<table>");
		expect(markdown).toContain('colspan="2"');
		expect(markdown).toContain('href="https://example.com"');
		expect(markdown).not.toContain("to-strip");
		expect(markdown).not.toContain("drop-class");
		expect(markdown).not.toContain("drop-id");
	});

	it("converts ltx equation tables to inline/block math from alttext", () => {
		const turndown = buildTurndown();
		const html = LTX_EQN_TABLE;

		const markdown = turndown.turndown(html);

		expect(markdown).toContain("$$");
		expect(markdown).toContain("x^2 + y^2 = z^2");
		expect(markdown).toContain("$a+b$");
	});

	it.todo("falls back to original content when table node is not an Element");
	it.todo("returns empty output for equation tables when no math alttext exists");
	it.todo("returns original image markdown when img src is empty and title/alt are missing");
});
