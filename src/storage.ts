import {Definition} from 'swagger/definition';
import {Parameter}  from 'swagger/parameter';
import {Service}    from 'swagger/service';

export class Storage {
	public static parameters: {[key: string]:Parameter} = {};
	public static services: {[key: string]:Service} = {};
	public static definitions: {[key: string]: Definition} = {};

	public static addDefinition(definition: Definition) {
		// this.definitions[definition.name]
	}

	public static addParameter(parameter: Parameter) {

	}

	public static addService(service: Service): void {
		if (!Storage.services[service.getServicePath()]) {
			Storage.services[service.getServicePath()] = service;
			return;
		}
		Storage.services[service.getServicePath()].merge(service);
	}
}
