import { makePluginMock, makeTFileMock } from "./obsidian";

type CreateSutOptions = {
	fetchImages?: boolean;
	notePath?: string;
	sourceHTML?: string;
	pluginOptions?: Parameters<typeof makePluginMock>[0];
};

type PluginMock = ReturnType<typeof makePluginMock>;
type HandlerFactory<T> = (plugin: PluginMock) => T;
type HandlerConstructor<T> = new (plugin: never) => T;

export function mockSuite<T>(
	createHandler: HandlerFactory<T>,
	options?: CreateSutOptions
): {
	plugin: PluginMock;
	handler: T;
	noteFile: never;
	document: Document;
};

export function mockSuite<T>(
	Handler: HandlerConstructor<T>,
	sourceHTML?: string,
	options?: Omit<CreateSutOptions, "sourceHTML">
): {
	plugin: PluginMock;
	handler: T;
	noteFile: never;
	document: Document;
};

export function mockSuite<T>(
	Handler: HandlerConstructor<T>,
	options?: CreateSutOptions
): {
	plugin: PluginMock;
	handler: T;
	noteFile: never;
	document: Document;
};

export function mockSuite<T>(
	handlerOrFactory: HandlerFactory<T> | HandlerConstructor<T>,
	sourceHtmlOrOptions: string | CreateSutOptions = {},
	extraOptions?: Omit<CreateSutOptions, "sourceHTML">): {
		plugin: PluginMock;
		handler: T;
		noteFile: never;
		document: Document;} 
	{
		const handlerPrototype = (handlerOrFactory as { prototype?: object }).prototype;
		const looksLikeClass =
			typeof handlerOrFactory === "function" &&
			!!handlerPrototype &&
			Object.getOwnPropertyNames(handlerPrototype).length > 1;

		const usingConstructorForm = looksLikeClass;

		const options: CreateSutOptions = usingConstructorForm
			? {
				...(typeof sourceHtmlOrOptions === "string" ? {} : sourceHtmlOrOptions),
				...(extraOptions ?? {}),
				sourceHTML:
					typeof sourceHtmlOrOptions === "string" ? sourceHtmlOrOptions : sourceHtmlOrOptions.sourceHTML,
			} : typeof sourceHtmlOrOptions === "string"
				? { sourceHTML: sourceHtmlOrOptions }
				: sourceHtmlOrOptions;

		const createHandler: HandlerFactory<T> = usingConstructorForm
			? (plugin) => new (handlerOrFactory as HandlerConstructor<T>)(plugin as never)
			: (handlerOrFactory as HandlerFactory<T>);

		const plugin = makePluginMock(options.pluginOptions);
		if (typeof options.fetchImages === "boolean") {
			plugin.settings.fetchImages = options.fetchImages;
		}

		const noteFile = makeTFileMock(options.notePath ?? "Notes/Test.md") as never;
		const document = new DOMParser().parseFromString(
			options.sourceHTML ?? "<html><body></body></html>",
			"text/html"
		);

		return {
			plugin,
			handler: createHandler(plugin),
			noteFile,
			document,
		};
}
