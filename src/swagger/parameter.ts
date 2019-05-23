import {ParameterModel} from '../models/swagger/parameter.model';

export class Parameter {

	public static fromSwagger(paramName: string, paramModel: ParameterModel): Parameter {
		const parameter: Parameter = new Parameter(paramName);
		if (paramModel.$ref) {
			parameter.ref = paramModel.$ref;
		} else {
			// console.log('x', paramName, paramModel);
		}
		return parameter;
	}

	private ref?: string;

	constructor(
		public name: string
	) {}

	public getName(): string {
		if (this.name) {
			return this.name;
		}
		if (this.ref) {
			return this.ref.replace('#/parameters/', '');
		}
		return '';
	}

	public getType(): string {
		return 'string'; // @todo fix it
	}
}
