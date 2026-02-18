type DebugSettings = {
	debug?: boolean;
};

function logScope(scope: string, message: string): string {
	return `[${scope}] ${message}`;
}

export function debugLog(
	settings: DebugSettings | undefined,
	message: string,
	...optionalParams: unknown[]
): void {
	if (!settings?.debug) return;
	console.debug(message, ...optionalParams);
}

export function warnLog(
	scope: string,
	message: string,
	...optionalParams: unknown[]
): void {
	console.warn(logScope(scope, message), ...optionalParams);
}

export function errorLog(
	scope: string,
	message: string,
	...optionalParams: unknown[]
): void {
	console.error(logScope(scope, message), ...optionalParams);
}
