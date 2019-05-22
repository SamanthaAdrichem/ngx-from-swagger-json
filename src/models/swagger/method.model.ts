import {ParameterModel} from './parameter.model';
import {ResponseModel}  from './response.model';

export class MethodModel {
	public tags?: string[];
	public summary?: string;
	public description?: string;
	public operationId?: string;
	public produces?: string[];
	public parameters?: ParameterModel[];
	public responses?: {[key:string]:ResponseModel};
}
