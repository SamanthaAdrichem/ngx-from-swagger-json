import {ParameterInEnum}  from './parameter-in.enum';
import {PropertyTypeEnum} from './property-type.enum';
import {SchemaModel}      from './schema.model';

export class ParameterModel {
	public description?: string;
	public in?: ParameterInEnum;
	public name?: string;
	public required?: boolean;
	public type?: PropertyTypeEnum;
	public $ref?: string;
	public schema?: SchemaModel;
}
