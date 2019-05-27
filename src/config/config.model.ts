export class ConfigModel {

	public hostname: string = '';
	public ignoreTls: boolean = false;
	public folders: string[] = [
		'docs',
	];
	public destinationDir: string = 'services';
	private readonly fallbackDestinationDir: string = '__ngx-from-swagger-json-output';

	constructor(config?: ConfigModel|null) {
		Object.assign(this, config);
	}

	public getDestinationDir(): string {
		if (this.destinationDir.length < 1) {
			return this.fallbackDestinationDir;
		}
		return this.destinationDir;
	}
}
