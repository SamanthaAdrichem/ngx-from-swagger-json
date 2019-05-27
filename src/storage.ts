import {ConfigModel} from './config/config.model';
import {Definition}  from './swagger/definition';
import {Parameter}   from './swagger/parameter';
import {Service}     from './swagger/service';

export class Storage {
	public static parameters: {[key: string]:Parameter} = {};
	public static services: {[key: string]:Service} = {};
	public static definitions: {[key: string]: Definition} = {};
	public static config: ConfigModel;

	public static addDefinition(definition: Definition) {
		this.definitions[definition.swaggerName] = definition;
	}

	public static getDefinition(definitionRef: string): Definition|null {
		return this.definitions[definitionRef.replace('#/definitions/', '')] || null;
	}

	public static addParameter(parameter: Parameter) {
		this.parameters[parameter.swaggerName] = parameter;
	}

	public static getParameter(paramRef: string): Parameter|null {
		return this.parameters[paramRef.replace('#/parameters/', '')] || null;
	}

	public static addService(service: Service): void {
		if (!Storage.services[service.getServicePath()]) {
			Storage.services[service.getServicePath()] = service;
			return;
		}
		Storage.services[service.getServicePath()].merge(service);
	}

	public static getServices(): {[key: string]:Service} {
		return this.services;
	}
}
