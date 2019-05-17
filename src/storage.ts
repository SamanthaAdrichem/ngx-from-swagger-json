import {Definition} from 'src/swagger/definition';
import {Parameter}  from 'src/swagger/parameter';
import {Service}    from 'src/swagger/service';

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
