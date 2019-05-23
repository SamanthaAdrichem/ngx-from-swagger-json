import {Response}       from './response';
import {MethodModel}    from '../models/swagger/method.model';
import {ParameterModel} from '../models/swagger/parameter.model';
import {Parameter}      from './parameter';

export class Method {

	public static fromSwagger(methodName: string, methodModel: MethodModel, isIdPath: boolean): Method {
		const method: Method = new Method();
		method.id = methodModel.operationId;
		method.name = Method.getMethodName(methodName, isIdPath);
		if (methodModel.parameters) {
			methodModel.parameters.map((parameter: ParameterModel) => method.addParameter(Parameter.fromSwagger(parameter.name || '', parameter)));
		}
		if (methodModel.responses) {
			if (methodModel.responses['200']) {
				method.setResponseModel(Response.fromSwagger(200, methodModel.responses['200']))
			} else if (methodModel.responses['201']) {
				method.setResponseModel(Response.fromSwagger(204, methodModel.responses['201']))
			}
		}
		return method;
	}

	public static getMethodName(methodName: string, isIdPath: boolean): string|null {
		switch (methodName) {
			case 'get':
				return isIdPath ? 'getById' : 'get';

			case 'post':
				return 'create';

			case 'delete':
				return 'remove';

			case 'put':
				return 'update';

			default:
				return null;
		}
	}

	public name: string|null = null;
	public id?: string;
	public parameters: {[key: string]: Parameter} = {};
	public response?: Response;

	public addParameter(parameter: Parameter): void {
		this.parameters[parameter.getName()] = parameter;
	}

	public setResponseModel(response: Response): void {
		this.response = response;
	}

	public getParameter(paramName: string): Parameter|null {
		return this.parameters[paramName] || null;
	}

}
