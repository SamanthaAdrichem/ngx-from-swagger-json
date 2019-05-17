import {DefinitionModel} from 'src/models/swagger/definition.model';
import {InfoModel}       from 'src/models/swagger/info.model';
import {ParameterModel}  from 'src/models/swagger/parameter.model';
import {PathModel}       from 'src/models/swagger/path.model';
import {ResponseModel}   from 'src/models/swagger/response.model';

export class SwaggerModel {
	public swagger?: string;
	public info?: InfoModel;
	public basePath?: string;
	public schemes?: string[];
	public paths?: {[key: string]: PathModel};
	public definitions?: {[key: string]: DefinitionModel};
	public parameters?: {[key: string]: ParameterModel};
	public responses?: {[key: string]: ResponseModel};
	public securityDefinitions?: any;
	public externalDocs?: any;

	constructor(config?: SwaggerModel|null) {
		Object.assign(this, config);
	}
}
