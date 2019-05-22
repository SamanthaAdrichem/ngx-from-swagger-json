import {DefinitionTypeEnum} from './definition-type.enum';
import {PropertyModel}      from './property.model';

export class DefinitionModel {
	public properties?: {[key: string]: PropertyModel};
	public type?: DefinitionTypeEnum;
}
