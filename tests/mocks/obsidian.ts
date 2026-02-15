export class Plugin {}
export class TFile {}
export class Editor {}
export class MarkdownView {
	file?: { path: string };
}

export class Notice {
	constructor(_message: string) {}
}

export async function requestUrl(_params: { url: string }): Promise<{
	text: string;
	arrayBuffer: ArrayBuffer;
}> {
	throw new Error("requestUrl mock not implemented for this test");
}

export function normalizePath(value: string): string {
	return value;
}

export function makePluginMock(activePath: string = "Notes/Test.md") {
	return {
		app: {
			workspace: {
				getActiveViewOfType: jest.fn().mockReturnValue({
					file: { path: activePath }
				})
			}
		}
	};
}

export function makeEditorMock(previousLine: string = "This is a normal line") {
	return {
		getCursor: jest.fn().mockReturnValue({ line: 1, ch: 0 }),
		getLine: jest.fn().mockImplementation((lineNo: number) => {
			if (lineNo === 0) return previousLine;
			return "";
		}),
		setLine: jest.fn(),
		replaceRange: jest.fn()
	};
}
