export class ConfigModel {
	public hostname: string = "services.daisycon.com";
	public ignoreTls: boolean = false;
	public folders: string[] = [
		// "docs-admin",
		// "docs-advertiser",
		// "docs-common",
		// "docs-leadgeneration",
		"docs-publisher",
		// "docs-user",
		// "docs-validate"
	];
	public destinationDir: string = "services";

	constructor(config?: ConfigModel|null) {
		Object.assign(this, config);
	}
}
