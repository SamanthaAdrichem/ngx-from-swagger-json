import {ParameterInEnum}   from './parameter-in.enum';
import {ParameterTypeEnum} from './parameter-type.enum';

export class ParameterModel {
	public description?: string;
	public in?: ParameterInEnum;
	public name?: string;
	public required?: boolean;
	public type?: ParameterTypeEnum;
	public $ref?: string;
}
