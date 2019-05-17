import {ParameterModel} from 'src/models/swagger/parameter.model';

export class Parameter {

	public static fromSwagger(paramName: string, paramModel: ParameterModel): Parameter {
		const parameter: Parameter = new Parameter(paramName);
		return parameter;
	}

	constructor(
		public name: string
	) {}
}
