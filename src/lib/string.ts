export class LibString {

	public static camelCaseName(name: string): string {
		return name.replace(
			/[-_\.]([a-z])/g,
			(item) => item[1].toUpperCase()
		);
	}

	public static extractSwaggerParams(path: string): string[] {
		const paramsRegExp = new RegExp('{\\s?([^{}\\s]*)\\s?}', 'g');
		return (path.match(paramsRegExp) || []);
	}

	public static upperCamelCaseName(name: string): string {
		const camelCasedName: string = LibString.camelCaseName(name);
		return camelCasedName.charAt(0).toUpperCase() + camelCasedName.substr(1);
	}

	public static dashCaseName(name: string): string {
		return name.replace(/_/g, '-').replace(/-+(?=-)/g,'-').toLowerCase();
	}

	public static safeEnumName(name: string): string {
		if ('' === name) {
			return 'EMPTY_VALUE';
		}
		return LibString.removeDoubles(name.replace(/[^A-Za-z0-9\_]/g, '_'), '_');
	}

	public static removeDoubles(inputString: string, doubleChar: string = '/'): string {
		return inputString.replace(new RegExp('(' + doubleChar+ '+)', 'g'), doubleChar);
	}

}
