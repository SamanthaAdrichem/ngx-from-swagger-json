import {ParameterInEnum}     from './parameter-in.enum';
import {ParameterItemsModel} from './parameter-items.model';
import {PropertyTypeEnum}    from './property-type.enum';
import {SchemaModel}         from './schema.model';

export class ParameterModel {
	public $ref?: string;
	public description?: string;
	public in?: ParameterInEnum;
	public items?: ParameterItemsModel;
	public name?: string;
	public required?: boolean;
	public schema?: SchemaModel;
	public type?: PropertyTypeEnum;
}
