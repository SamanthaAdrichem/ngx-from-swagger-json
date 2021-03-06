export class ConfigModel {

	public destinationDir: string = 'services';
	public flatten: boolean = false;
	public ignoreTls: boolean = false;
	public location: string = '';
	public moduleName: string|null = null;
	public apiBasePath: string|null = null;
	public filtersAlsoAsArray: boolean = false;
	public filtersAlsoAsArrayExcludes: string[] = ['page', 'per_page', 'order_by', 'order_direction'];
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
