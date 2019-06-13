import {ComponentsModel} from './swagger/components.model';
import {DefinitionModel} from './swagger/definition.model';
import {InfoModel}       from './swagger/info.model';
import {ParameterModel}  from './swagger/parameter.model';
import {PathModel}       from './swagger/path.model';
import {ResponseModel}   from './swagger/response.model';

export class SwaggerModel {
	public swagger?: string;
	public info?: InfoModel;
	public basePath?: string;
	public schemes?: string[];
	public paths?: {[key: string]: PathModel};
	public components?: ComponentsModel;
	public definitions?: {[key: string]: DefinitionModel};
	public parameters?: {[key: string]: ParameterModel};
	public responses?: {[key: string]: ResponseModel};
	public securityDefinitions?: any;
	public externalDocs?: any;

	constructor(config?: SwaggerModel|null) {
		Object.assign(this, config);
	}
}
