export class Logger {

	public static verbose: boolean = false;

	public static log(message: string) {
		if (Logger.verbose) {
			console.log(message);
		}
	}

}
