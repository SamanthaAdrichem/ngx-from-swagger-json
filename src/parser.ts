import {get}          from 'https';
import * as process   from 'process';
import {LibFile}      from './lib/file';
import {LibObject}    from './lib/object';
import {LibString}    from './lib/string';
import {SwaggerModel} from './models/swagger.model';
import {Storage}      from './storage';
import {Definition}   from './swagger/definition';
import {Parameter}    from './swagger/parameter';
import {Service}      from './swagger/service';

export class Parser {

	public parse(): Promise<void> {
		if (!Storage.config.location) {
			console.error('Location is missing in config');
			return process.exit(1);
		}
		return this.fetchJsonFile(Storage.config.location);
	}

	private fetchJsonFile(location: string): Promise<void> {
		return new Promise((resolve, reject) => {
			const requestUrl: string = location + (location.endsWith('swagger.json') ? '' : '/api/swagger.json');
			try {
				get(requestUrl, (res) => {
					let dataBuffer: string = '';
					res.on('data', (data) => {
						dataBuffer += data;
					});
					res.on('end', () => {
						this.parseJsonFile(requestUrl, dataBuffer);
						resolve();
					})
				});
			}
			catch (error) {
				console.error('Could not fetch: ' + requestUrl, error);
				reject();
			}
		});
	}

	private parseJsonFile(requestUrl: string, swaggerJson: string) {
		let parsedJson: SwaggerModel;
		try {
			parsedJson = JSON.parse( swaggerJson ) as SwaggerModel;
		}
		catch(error) {
			console.error('Invalid json at: ' + requestUrl);
			return process.exit(1);
		}

		if (!parsedJson.paths) {
			console.error('paths missing at: ' + requestUrl);
		}

		if (!parsedJson.definitions) {
			console.error('definitions missing at: ' + requestUrl);
			return;
		}

		this.parseParameters(parsedJson);
		this.parseDefinitions(parsedJson);
		this.parseServices(parsedJson);

		this.checkFlattening();

		this.generateServices();
		this.generateModuleFile();

	}

	private checkFlattening() {
		if (!Storage.config.flatten) {
			return;
		}
		if (Object.keys(Storage.services).length === 0) {
			return;
		}

		const flattenAblePaths: {[key: string]: boolean} = {};
		let fullPath: string = '';
		Object.keys(Storage.services)[0].split('/').map((pathName: string) => {
			if ('' === pathName) {
				return;
			}
			fullPath += '/' + pathName;
			flattenAblePaths[fullPath] = true;
		});

		Object.keys(Storage.services).map((servicePath: string) => {
			Object.keys(flattenAblePaths).map((pathName: string) => {
				if (!servicePath.startsWith(pathName)) {
					flattenAblePaths[pathName] = false;
				}
			});
		});

		Object.keys(flattenAblePaths).map((pathName: string) => {
			if (flattenAblePaths[pathName]) {
				if ('' === Storage.skipPath || pathName.startsWith(Storage.skipPath)) {
					Storage.skipPath = pathName;
				}
			}
		});
	}

	private parseParameters(parsedJson: SwaggerModel) {
		for (const paramName in parsedJson.parameters) {
			if (!parsedJson.parameters.hasOwnProperty(paramName)) {
				continue;
			}
			Storage.addParameter(Parameter.fromSwagger(paramName, parsedJson.parameters[paramName]));
		}
	}

	private parseDefinitions(parsedJson: SwaggerModel) {
		for (const definitionName in parsedJson.definitions) {
			if (!parsedJson.definitions.hasOwnProperty(definitionName)) {
				continue;
			}
			Storage.addDefinition(Definition.fromSwagger(definitionName, parsedJson.definitions[definitionName]));
		}
	}

	private parseServices(parsedJson: SwaggerModel) {
		for (const servicePath in parsedJson.paths) {
			if (!parsedJson.paths.hasOwnProperty(servicePath)) {
				continue;
			}
			Storage.addService(Service.fromSwagger(servicePath, parsedJson.paths[servicePath]));
		}
	}

	private generateServices() {
		const services: {[key: string]:Service} = Storage.getServices();
		for (const servicePath in services) {
			if (!services.hasOwnProperty(servicePath)) {
				continue;
			}
			services[servicePath].export();
		}
	}

	private generateModuleFile() {
		const destinationDirFolder: string|undefined = Storage.config.getDestinationDir().split('/').pop();
		if (!destinationDirFolder) {
			return;
		}
		const moduleName: string = LibString.upperCamelCaseName(Storage.config.moduleName || destinationDirFolder) + 'Module';
		const moduleFilename: string =  Storage.config.getDestinationDir() + '/' + LibString.dashCaseName(Storage.config.moduleName || destinationDirFolder) + '.module.ts';

		const services: {[key: string]:Service} = Storage.getServices();
		const imports: {[key: string]:string[]} = {
			'@angular/common/http': ['HttpClientModule'],
			'@angular/core': ['NgModule']
		};
		const providers: {[key: string]:string} = {};

		for (const servicePath in services) {
			if (!services.hasOwnProperty(servicePath)) {
				continue;
			}
			const service: Service = services[servicePath];
			const serviceName: string|null = service.getServiceName();
			let serviceFilename: string|null = service.getServiceFilename();
			let serviceAlias: string|null = null;
			if (null === serviceName || null === serviceFilename) {
				return;
			}
			serviceFilename = service.getServiceDirectory() + '/' + serviceFilename;

			if (providers[serviceName]) {
				serviceAlias = LibString.upperCamelCaseName(serviceFilename.replace(/\//g, '-'));
				providers[serviceAlias] = serviceName;
			} else {
				providers[serviceName] = serviceName;
			}

			LibObject.addKeyedValue(imports, serviceFilename, serviceName + (serviceAlias ? ' as ' + serviceAlias : ''));

		}

		let fileContents: string = '';
		fileContents += LibFile.generateImportStatements(imports) +
			"@NgModule({\n" +
			"\timports: [\n" +
			"\t\tHttpClientModule\n" +
			"\t],\n" +
			"\tproviders: [\n" +
			"\t\t" + Object.keys(providers).sort().join(",\n\t\t") + "\n" +
			"\t]\n" +
			"})\n" +
			"export class " + moduleName + " {}\n";

		LibFile.writeFile(moduleFilename, fileContents, true);
	}
}
