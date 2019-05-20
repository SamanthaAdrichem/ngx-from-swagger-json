import {get}          from 'https';
import * as process   from "process";
import {ConfigModel}  from 'config/config.model';
import {Logger}       from 'logger';
import {SwaggerModel} from 'models/swagger.model';
import {Storage}      from 'storage';
import {Definition}   from 'swagger/definition';
import {Parameter}    from 'swagger/parameter';
import {Service}      from 'swagger/service';

export class Parser {

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
			console.log('Could not fetch: ' + requestUrl, error);
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
			console.log('paths missing at: ' + requestUrl);
		}

		if (!parsedJson.definitions) {
			console.log('definitions missing at: ' + requestUrl);
			return;
		}

		this.parseParameters(parsedJson);
		this.parseDefinitions(parsedJson);
		this.parseServices(parsedJson);

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
		for (const path in parsedJson.paths) {
			if (!parsedJson.paths.hasOwnProperty(path)) {
				continue;
			}
			Storage.addService(Service.fromSwagger(path, parsedJson.paths[path]));
		}

	}
}
