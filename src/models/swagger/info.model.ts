export class InfoModel {
	public title?: string;
	public description?: string;
	public termsOfService?: string;
	public contact?: {[key:string]:string};
	public version?: string;

	constructor(config?: InfoModel|null) {
		Object.assign(this, config);
	}
}
