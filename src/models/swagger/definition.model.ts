import {DefinitionTypeEnum} from 'src/models/swagger/definition-type.enum';
import {PropertyModel}      from 'src/models/swagger/property.model';

export class DefinitionModel {
	public properties?: {[key: string]: PropertyModel};
	public type?: DefinitionTypeEnum;
}
