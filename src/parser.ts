import {get}          from 'https';
import * as path      from 'path';
import * as process   from "process";
import {ConfigModel}  from './config/config.model';
import {Logger}       from './logger';
import {SwaggerModel} from './models/swagger.model';
import {Storage}      from './storage';
import {Definition}   from './swagger/definition';
import {Parameter}    from './swagger/parameter';
import {Service}      from './swagger/service';

export class Parser {

	readonly fallbackDestinationDir: string = './__ngx-from-swagger-json/';

	constructor(
		private logger: Logger,
		private config: ConfigModel
	) {}

	public parse() {
		if (!this.config.hostname) {
			console.error('Hostname is missing in config');
			return process.exit(1);
		}

		if (!this.config.folders || this.config.folders.length === 0) {
			console.error('Folders missing in config');
			return process.exit(1);
		}
		this.config.folders.map((folder: string) => this.fetchJsonFile(folder));

	}

	private fetchJsonFile(folder: string) {
		const requestUrl: string = 'https://' + this.config.hostname + '/' + folder + '/api/swagger.json';
		try {
			get(requestUrl, (res) => {
				let dataBuffer: string = '';
				res.on('data', (data) => {
					dataBuffer += data;
				});
				res.on('end', () => {
					this.parseJsonFile(requestUrl, dataBuffer);
				})
			});
		}
		catch (error) {
			console.error('Could not fetch: ' + requestUrl, error);
		}
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

		this.generateServices();

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
		console.log(process.cwd());
		const exportDestination: string = path.resolve(process.cwd() + '/' + this.config.destinationDir || this.fallbackDestinationDir);
		console.log(exportDestination);
		const services: {[key: string]:Service} = Storage.getServices();
		for (const servicePath in services) {
			if (!services.hasOwnProperty(servicePath)) {
				continue;
			}
			services[servicePath].export(exportDestination);
			process.exit(1);
		}
	}
}
