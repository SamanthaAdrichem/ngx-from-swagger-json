import {DefinitionModel} from './definition.model';
import {ParameterModel}  from './parameter.model';

export class ComponentsModel {
	public schemas?: {[key: string]: DefinitionModel};
	public responses?: {[key: string]: any};
	public parameters?: {[key: string]: ParameterModel};
}
