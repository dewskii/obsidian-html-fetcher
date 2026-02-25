/** 
  inspired heavily by defuddle's table rules
  would use defuddle over readability but I need to 
  manipulate the turndown service for localized images
  https://github.com/kepano/defuddle/blob/main/src/markdown.ts#L52
**/

import TurndownService from "turndown";

const TABLE_ALLOWED_ATTRIBUTES = new Set([
	"src",
	"href",
	"style",
	"align",
	"width",
	"height",
	"rowspan",
	"colspan",
	"bgcolor",
	"scope",
	"valign",
	"headers"
]);

function getElement(node: Node): Element | null {
	if (node.nodeType !== Node.ELEMENT_NODE) return null;
	return node as Element;
}

function isEquationTable(table: Element): boolean {
	return (
		table.classList.contains("ltx_equation") ||
		table.classList.contains("ltx_eqn_table")
	);
}

function hasComplexSpan(table: Element): boolean {
	const cells = Array.from(table.querySelectorAll("td, th"));
	return cells.some((cell) => cell.hasAttribute("colspan") || cell.hasAttribute("rowspan"));
}

function cleanElements(element: Element): void {
	for (const attr of Array.from(element.attributes)) {
		if (!TABLE_ALLOWED_ATTRIBUTES.has(attr.name)) {
			element.removeAttribute(attr.name);
		}
	}

	for (const child of Array.from(element.children)) {
		cleanElements(child);
	}
}

function cleanTable(table: Element): string {
	const tableClone = table.cloneNode(true) as Element;
	cleanElements(tableClone);
	return (tableClone as HTMLElement).outerHTML;
}

function convertTableToMarkdown(
	table: Element,
	turndown: TurndownService,
	fallbackContent: string
): string {
	const rows = Array.from(table.querySelectorAll("tr"));
	if (rows.length === 0) return fallbackContent;

	const renderedRows = rows
		.map((row) => {
			const cells = Array.from(row.querySelectorAll("th, td"));
			if (cells.length === 0) return "";

			const renderedCells = cells.map((cell) => {
				const markdown = turndown.turndown(cell.innerHTML)
					.replace(/\n/g, " ")
					.trim();
				return markdown.replace(/\|/g, "\\|");
			});

			return `| ${renderedCells.join(" | ")} |`;
		})
		.filter((row) => row.length > 0);

	if (renderedRows.length === 0) return fallbackContent;

	const firstRow = rows.find((row) => row.querySelectorAll("th, td").length > 0);
	if (!firstRow) return fallbackContent;

	const columnCount = Array.from(firstRow.querySelectorAll("th, td")).length;
	const separatorRow = `| ${Array(columnCount).fill("---").join(" | ")} |`;
	const tableContent = [renderedRows[0], separatorRow, ...renderedRows.slice(1)].join("\n");

	return `\n\n${tableContent}\n\n`;
}

function handleNestedEquations(table: Element): string {
	const mathElements = Array.from(table.querySelectorAll("math[alttext]"));
	if (mathElements.length === 0) return "";

	return mathElements
		.map((mathElement) => {
			const alttext = mathElement.getAttribute("alttext");
			if (!alttext) return "";

			const expression = alttext.trim();
			const isInline = mathElement.closest(".ltx_eqn_inline") !== null;
			return isInline ? `$${expression}$` : `\n$$\n${expression}\n$$`;
		})
		.filter((value) => value.length > 0)
		.join("\n\n");
}

export function getTurnDownService(): TurndownService {
	return new TurndownService({
		headingStyle: 'atx',
		hr: '---',
		bulletListMarker: '-',
		codeBlockStyle: 'fenced',
		emDelimiter: '*',
		preformattedCode: true,
	});
}

export function registerTableRule(turndown: TurndownService): void {
	turndown.addRule("table", {
		filter: "table",
		replacement: (content, node) => {
			const table = getElement(node);
			if (!table) return content;

			if (isEquationTable(table)) {
				return handleNestedEquations(table);
			}

			if (hasComplexSpan(table)) {
				return `\n\n${cleanTable(table)}\n\n`;
			}

			return convertTableToMarkdown(table, turndown, content);
		}
	});
}

export function registerImageRule(turndown: TurndownService): void {
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
}