import {ParameterInEnum}   from 'src/models/swagger/parameter-in.enum';
import {ParameterTypeEnum} from 'src/models/swagger/parameter-type.enum';

export class ParameterModel {
	public description?: string;
	public in?: ParameterInEnum;
	public name?: string;
	public required?: boolean;
	public type?: ParameterTypeEnum;
}
