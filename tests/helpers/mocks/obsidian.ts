/*
	mocks for obsidian-api
*/
export class Plugin {}
export class TFile {}
export class Editor {}
export class App {}
export class MarkdownView {
	file?: { path: string };
}

// export class PluginSettingTab {
// 	constructor(_app: App, _plugin: Plugin) {}
// }

// export class Setting {
// 	setName(_name: string): this {
// 		return this;
// 	}

// 	setDesc(_desc: string): this {
// 		return this;
// 	}

// 	addText(_cb: (text: {
// 		setPlaceholder: (value: string) => unknown;
// 		setValue: (value: string) => unknown;
// 		onChange: (fn: (value: string) => Promise<void>) => unknown;
// 	}) => unknown): this {
// 		return this;
// 	}

// 	addToggle(_cb: (toggle: {
// 		setValue: (value: boolean) => unknown;
// 		onChange: (fn: (value: boolean) => Promise<void>) => unknown;
// 	}) => unknown): this {
// 		return this;
// 	}
// }

// export class SettingGroup {
// 	constructor(_containerEl: unknown) {}

// 	setHeading(_heading: string): this {
// 		return this;
// 	}

// 	addSetting(cb: (setting: Setting) => unknown): this {
// 		cb(new Setting());
// 		return this;
// 	}
// }

export class Notice {
	constructor(_message: string) {}
}

export type RequestUrlResponse = {
	text: string;
	arrayBuffer: ArrayBuffer;
};

const defaultRequestUrl = async (_params: { url: string }): Promise<RequestUrlResponse> => {
	throw new Error("requestUrl mock not implemented for this test");
};

export const requestUrl = jest.fn(defaultRequestUrl);

export function mockRequestUrlResolved(response: RequestUrlResponse): void {
	requestUrl.mockResolvedValue(response);
}

export function mockRequestUrlRejected(error: unknown): void {
	requestUrl.mockRejectedValue(error);
}

export function resetRequestUrlMock(): void {
	requestUrl.mockReset();
	requestUrl.mockImplementation(defaultRequestUrl);
}

type PluginMockOptions = {
	activePath?: string;
	activeViewReturn?: { file?: { path: string } } | null;
	initialFileContent?: string;
};

export function makePluginMock(options: PluginMockOptions = {}) {
	const activePath = options.activePath ?? "Notes/Test.md";
	const activeViewReturn =
		options.activeViewReturn ?? ({ file: { path: activePath } } as const);
	const initialFileContent = options.initialFileContent ?? "";

	return {
		app: {
			workspace: {
				getActiveViewOfType: jest.fn().mockReturnValue(activeViewReturn)
			},
			vault: {
				read: jest.fn().mockResolvedValue(initialFileContent),
				modify: jest.fn().mockResolvedValue(undefined),
				createFolder: jest.fn().mockResolvedValue(undefined),
				adapter: {
					writeBinary: jest.fn().mockResolvedValue(undefined)
				}
			}
		},
		settings: {
			defaultAttachmentFolderPath: "Attachments",
			attachmentFolderPath: "",
			useNoteFolder: true,
			fetchImages: true,
			debug: false
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

export function makeTFileMock(path: string = "Notes/Test.md") {
	const name = path.split("/").pop() ?? "Test.md";
	const parentPath = path.includes("/")
		? path.slice(0, Math.max(path.lastIndexOf("/"), 0))
		: "";
	return {
		path,
		name,
		parent: parentPath ? { path: parentPath } : undefined
	};
}

const defaultNormalizePathMock = (path: string): string => {
	return path;
}


export const normalizePath = jest.fn(defaultNormalizePathMock);

export function resetNormalizePathMock(): void {
	normalizePath.mockReset();
	normalizePath.mockImplementation(defaultNormalizePathMock);
}
