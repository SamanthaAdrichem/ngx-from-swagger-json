import * as path        from "path";
import * as process     from "process";
import {MethodModel}    from '../models/swagger/method.model';
import {ParameterModel} from '../models/swagger/parameter.model';
import {Parameter}      from './parameter';
import {Response}       from './response';

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

	public exportFilter(serviceName: string, serviceFileName: string, exportDestination: string): boolean {
		if (Object.keys(this.parameters).length < 1) {
			return false;
		}

		let relativePath: string = exportDestination.replace(path.resolve(process.cwd()), '');
		if (path.sep === '\\') {
			relativePath = relativePath.replace(/\\/g, '/');
		}
		if (relativePath.substr(0, 1) === '/') {
			relativePath = relativePath.substr(1);
		}
		if (relativePath.substr(-1) === '/') {
			relativePath = relativePath.substr(0, relativePath.length - 1);
		}

		const modelName: string = this.getFilterName(serviceName);
		const modelFileName: string = this.getFilterFileName(serviceFileName);
		const imports: {[key: string]: string} = {};

		let fileContents: string = "" +
			"export class " + modelName + " {\n" +
			"\n";

		for (const paramKey in this.parameters) {
			if (!this.parameters.hasOwnProperty(paramKey)) {
				continue;
			}
			const parameter: Parameter = this.parameters[paramKey];
			const paramName: string|null = parameter.getName();
			if (null === paramName) {
				continue;
			}
			fileContents += "" +
				"\t" + paramName + ": " + parameter.getType() + ";\n";
		}

		fileContents += "" +
			"\n" +
			"\tconstructor(values?: " + modelName + ") {\n" +
			"\t\tObject.assign(this, values || {});\n" +
			"\t}\n" +
			"\n" +
			"}\n";

		if (Object.keys(imports).length > 0) {
			fileContents = Object.values(imports).join("\n") + "\n\n" + fileContents;
		}

		console.log('FILTER', fileContents);

		return true;
	}

	public getFilterName(serviceName: string): string {
		return serviceName.replace('Service', 'FilterModel');
	}

	public getFilterFileName(serviceFileName: string): string {
		return serviceFileName.replace('.service.ts', '-filter.model.ts');
	}

	public exportBody(exportDestination: string): boolean {
		for (const param in this.parameters) {
			if (!this.parameters.hasOwnProperty(param)) {
				continue;
			}
			if (this.parameters[param].swaggerName === 'body') {
				return this.parameters[param].export(exportDestination);
			}
		}
		return false;
	}

	public getBodyName(): string|null {
		for (const param in this.parameters) {
			if (!this.parameters.hasOwnProperty(param)) {
				continue;
			}
			if (this.parameters[param].swaggerName === 'body') {
				return this.parameters[param].getName();
			}
		}
		return null;
	}

	public getBodyImportStatement(exportDestination: string): string|null {
		for (const param in this.parameters) {
			if (!this.parameters.hasOwnProperty(param)) {
				continue;
			}
			if (this.parameters[param].swaggerName === 'body') {
				return this.parameters[param].getImportStatement(exportDestination);
			}
		}
		return null;
	}

}
