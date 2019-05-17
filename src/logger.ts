export class Logger {
	private verbose: boolean = false;

	constructor(verbose: boolean) {
		this.verbose = verbose;
	}

	public log(message: string) {
		if (this.verbose) {
			console.log(message);
		}
	}
}
