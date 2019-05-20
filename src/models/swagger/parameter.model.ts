import {ParameterInEnum}   from 'models/swagger/parameter-in.enum';
import {ParameterTypeEnum} from 'models/swagger/parameter-type.enum';

export class ParameterModel {
	public description?: string;
	public in?: ParameterInEnum;
	public name?: string;
	public required?: boolean;
	public type?: ParameterTypeEnum;
}
