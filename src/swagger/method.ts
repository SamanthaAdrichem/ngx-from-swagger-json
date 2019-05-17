import {MethodModel} from 'src/models/swagger/method.model';

export class Method {

	public static fromSwagger(methodName: string, methodModel: MethodModel, isIdPath: boolean): Method {
		const method: Method = new Method();
		method.id = methodModel.operationId;
		method.name = Method.getMethodName(methodName, isIdPath);
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

}
