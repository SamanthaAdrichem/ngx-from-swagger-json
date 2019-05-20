import {DefinitionTypeEnum} from 'models/swagger/definition-type.enum';
import {PropertyModel}      from 'models/swagger/property.model';

export class DefinitionModel {
	public properties?: {[key: string]: PropertyModel};
	public type?: DefinitionTypeEnum;
}
