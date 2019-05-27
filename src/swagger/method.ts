import {LibFile}          from '../lib/file';
import {LibString}        from '../lib/string';
import {Logger}           from '../logger';
import {MethodModel}      from '../models/swagger/method.model';
import {ParameterInEnum}  from '../models/swagger/parameter-in.enum';
import {ParameterModel}   from '../models/swagger/parameter.model';
import {MethodActionEnum} from './method-action.enum';
import {MethodEnum}       from './method.enum';
import {Parameter}        from './parameter';
import {Response}         from './response';

export class Method {

	public static fromSwagger(methodName: string, methodModel: MethodModel, isIdPath: boolean): Method {
		const method: Method = new Method(methodName, isIdPath);
		method.id = methodModel.operationId;
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

	public name: MethodEnum|null = null;
	public id?: string;
	public parameters: {[key: string]: Parameter} = {};
	public pathParameters: {[key: string]: Parameter} = {};
	public response?: Response;
	public apiAction?: MethodActionEnum;

	public constructor(
		methodName: string,
		private idAction: boolean
	) {
		this.parseMethodName(methodName);
	}

	public isIdAction(): boolean {
		return this.idAction;
	}

	public addParameter(parameter: Parameter): void {
		switch (parameter.getSource()) {
			case ParameterInEnum.query:
				this.parameters[parameter.getName()] = parameter;
				break;

			case ParameterInEnum.path:
				this.pathParameters[parameter.getName()] = parameter;
				break;

			default:
				console.warn('Missing IN', parameter);
		}

	}

	public setResponseModel(response: Response): void {
		this.response = response;
	}

	public getParameter(paramName: string): Parameter|null {
		return this.parameters[paramName] || this.pathParameters[paramName] || null;
	}

	public exportFilter(methodName: MethodEnum, serviceName: string, serviceFilename: string, exportDestination: string): boolean {
		if (Object.keys(this.parameters).length < 1) {
			return false;
		}

		const modelName: string = this.getFilterName(methodName, serviceName);
		const modelFilename: string = this.getFilterFilename(methodName, serviceFilename);
		const imports: {[key: string]: string[]} = {};

		let fileContents: string = "" +
			"export class " + modelName + " {\n" +
			"\n";

		const paramKeys: string[] = Object.keys(this.parameters).sort();
		for (const paramKey of paramKeys) {
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
			fileContents = LibFile.generateImportStatements(imports) + fileContents;
		}

		Logger.log('Generated filter model: ' + modelName);
		LibFile.writeFile(exportDestination + '/' + modelFilename, fileContents, true);

		return true;
	}

	public getFilterName(methodName: MethodEnum, serviceName: string): string {
		return serviceName.replace('Service', LibString.upperCamelCaseName(methodName) + 'FilterModel');
	}

	public getFilterFilename(methodName: MethodEnum, serviceFilename: string): string {
		switch (methodName) {
			case MethodEnum.getById:
				return serviceFilename.replace('.service.ts', '-get-by-id-filter.model.ts');

			default:
				return serviceFilename.replace('.service.ts', '-' + methodName + '-filter.model.ts');
		}
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

	public getBodyModelFilename(): string|null {
		for (const param in this.parameters) {
			if (!this.parameters.hasOwnProperty(param)) {
				continue;
			}
			if (this.parameters[param].swaggerName === 'body') {
				return this.parameters[param].getModelFilename();
			}
		}
		return null;
	}

	private parseMethodName(methodName: string): void {
		switch (methodName) {
			case 'get':
				this.name = this.idAction ? MethodEnum.getById : MethodEnum.get;
				this.apiAction = this.idAction ? MethodActionEnum.getById : MethodActionEnum.get;
				break;

			case 'post':
				this.name = MethodEnum.create;
				this.apiAction = MethodActionEnum.create;
				break;

			case 'delete':
				this.name = MethodEnum.remove;
				this.apiAction = MethodActionEnum.remove;
				break;

			case 'put':
				this.name = MethodEnum.update;
				this.apiAction = MethodActionEnum.update;
				break;

			default:
				break;
		}
	}

}
