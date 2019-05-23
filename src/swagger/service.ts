import * as fs     from 'fs';
import * as path   from 'path';
import {LibString} from '../lib/string';
import {PathModel} from '../models/swagger/path.model';
import {Method}    from './method';
import {Parameter} from './parameter';

export class Service {

	public static fromSwagger(swaggerPath: string, methods: PathModel): Service {
		const service: Service = new Service();
		const pathParams = LibString.extractSwaggerParams(swaggerPath);
		let isIdPath: boolean = false;
		let servicePath: string = swaggerPath;
		let apiPath: string = swaggerPath;
		const pathParamDict: string[] = [];

		pathParams.map((param) => {
			if (true === swaggerPath.endsWith(param)) {
				service.setIdParam(param);
				isIdPath = true;
				apiPath = apiPath.replace(param, '');
				return;
			}
			pathParamDict.push(service.parseUrlParam(param));
			servicePath = servicePath.replace('/' + param, '');
			apiPath = apiPath.replace(param , "' + " + LibString.camelCaseName(service.parseUrlParam(param)) + " + '");
		});

		service.setServicePath(servicePath);
		service.setApiPath(apiPath);

		if (servicePath === '/publishers/programs') {
			// console.log(pathParamDict);
		}

		if (methods.get) {
			service.addMethod(Method.fromSwagger('get', methods.get, isIdPath));
		}
		if (methods.put) {
			service.addMethod(Method.fromSwagger('put', methods.put, isIdPath));
		}
		if (methods.post) {
			service.addMethod(Method.fromSwagger('post', methods.post, isIdPath));
		}
		if (methods.delete) {
			service.addMethod(Method.fromSwagger('delete', methods.delete, isIdPath));
		}
		if (methods.patch) {
			service.addMethod(Method.fromSwagger('patch', methods.patch, isIdPath));
		}

		const serviceMethods: {[key: string]:Method} = service.getMethods();

		for (const paramName of pathParamDict) {
			for (const methodName in serviceMethods) {
				if (!serviceMethods.hasOwnProperty(methodName)) {
					continue;
				}
				const parameter: Parameter|null = serviceMethods[methodName].getParameter(paramName);
				if (parameter) {
					service.addPathParam(parameter);
				}
			}
		}

		return service;
	}

	private apiPath: string = '';
	private idParam?: string;
	private methods: {[key: string]:Method} = {};
	private pathParams: Parameter[] = [];
	private servicePath: string = '';

	public addMethod(method: Method) {
		if (null === method.name) {
			return; // @todo maybe skip it?
		}
		this.methods[method.name] = method;
	}

	public getMethods(): {[key: string]:Method} {
		return this.methods;
	}

	public addPathParam(parameter: Parameter): void {
		this.pathParams.push(parameter);
	}

	public setIdParam(paramName: string): void {
		this.idParam = this.parseUrlParam(paramName);
	}

	public setServicePath(servicePath: string): void {
		this.servicePath = servicePath;
	}

	public setApiPath(apiPath: string): void {
		this.apiPath = apiPath;
	}

	public parseUrlParam(paramName: string): string {
		return paramName.substr(1, paramName.length -2 );
	}

	public getServicePath(): string {
		return this.servicePath;
	}

	public getServiceDirectory(): string|null {
		if (!this.servicePath) {
			return null;
		}
		const serviceDirectory: string[] = this.servicePath.split('/');
		serviceDirectory.pop();
		return serviceDirectory.join('/');
	}

	public merge(service: Service) {
		const methods: {[key: string]:Method} = service.getMethods();
		for (const method in methods) {
			if (!methods.hasOwnProperty(method)) {
				continue;
			}
			this.addMethod(methods[method]);
		}
	}

	public getServiceName(): string|null {
		if (!this.servicePath) {
			return null;
		}
		return LibString.upperCamelCaseName((this.servicePath.split('/').pop() || '')) || null;
	}

	public export(rootExportDestination: string): void {
		const serviceName: string|null = this.getServiceName();
		if (null === serviceName) {
			console.warn('Could not export empty service', this);
			return;
		}

		const serviceDirectory: string = this.getServiceDirectory() || '';
		const fullServiceDirectory: string = rootExportDestination + serviceDirectory;

		// const serviceDirectory =
		// console.log(this, serviceName, serviceDirectory, path.resolve(rootExportDestination + '/' + serviceDirectory));
		try {
			fs.mkdirSync(path.resolve(fullServiceDirectory), { recursive: true });
		}
		catch (err) {
			if (err.code !== 'EEXIST') {
				throw err;
			}
		}

		const imports: string[] = [];
		let fileContents: string = '';
		const pathParams: string[] = [];
		console.log('wee', this.pathParams);
		this.pathParams.map((parameter: Parameter) => {
			pathParams.push(LibString.camelCaseName(parameter.getName()) + ': ' + parameter.getType());
		});

		fileContents += "" +
			"@Injectable()\n" +
			"export class " + serviceName + " {\n" +
			"\n" +
			"\tconstructor(\n" +
			"\t\tprivate httpClient: HttpClient\n" +
			"\t) {}\n" +
			"\n";

		if (this.methods.get) {
			const requestParams: string = pathParams.join(',');
			if (this.methods.get.parameters) {
				// generate body
			}
			let responseModel: string = 'void';
			console.log(this.pathParams);
			if (this.methods.get.response) {
				responseModel = this.methods.get.response.getModelName() || responseModel;
				if ('void' !== responseModel) {
					this.methods.get.response.export(fullServiceDirectory);
					const importStatement: string|null = this.methods.get.response.getImportStatement(rootExportDestination);
					if (null !== importStatement) {
						imports.push(importStatement);
					}
				}
			}
			fileContents += "" +
				"\tget(" + requestParams + "): Observable<" + responseModel + "> {\n" +
				"\t\treturn this.httpClient.get<" + responseModel + ">(\n" +
				"\t\t\t'" + this.apiPath + (requestParams ? ',' : '') + "'\n" +
				(requestParams ? "\t\t\tquery || {}\n" : "") +
				"\t\t);\n" +
				"\t)\n" +
				"\n";
		}

		if (this.methods.getById) {
			const idParamType: string = '';
			const responseModel: string = '';
			fileContents += "" +
				"\tgetById(" + this.idParam + ": " + idParamType + "): Observable<" + responseModel + "> {\n" +
				"\t\treturn this.httpClient.get<" + responseModel + ">(\n" +
				"\t\t\t'" + this.apiPath + '/{{' + this.idParam + "}}'\n" +
				"\t\t);\n" +
				"\t)\n" +
				"\n";
		}

		if (this.methods.create) {
			const requestBody: string = '';
			const responseModel: string = '';
			fileContents += "" +
				"\tcreate(" + requestBody + "): Observable<" + responseModel + "> {\n" +
				"\t\treturn this.httpClient.post<" + responseModel + ">(\n" +
				"\t\t\t'" + this.apiPath + "',\n" +
				"\t\t\tbody\n" +
				"\t\t);\n" +
				"\t)\n" +
				"\n";
		}

		if (this.methods.update) {
			const idParamType: string = '';
			const requestBody: string = '';
			const responseModel: string = '';
			fileContents += "" +
				"\tcreate(" + this.idParam + ": " + idParamType + ", " + requestBody + "): Observable<" + responseModel + "> {\n" +
				"\t\treturn this.httpClient.put<" + responseModel + ">(\n" +
				"\t\t\t'" + this.apiPath + '/{{' + this.idParam + "}}',\n" +
				"\t\t\tbody\n" +
				"\t\t);\n" +
				"\t)\n" +
				"\n";
		}

		if (this.methods.remove) {
			const idParamType: string = '';
			const responseModel: string = '';
			fileContents += "" +
				"\tremove(" + this.idParam + ": " + idParamType + "): Observable<" + responseModel + "> {\n" +
				"\t\treturn this.httpClient.get<" + responseModel + ">(\n" +
				"\t\t\t'" + this.apiPath + '/{{' + this.idParam + "}}'\n" +
				"\t\t);\n" +
				"\t)\n" +
				"\n";
		}

		fileContents += "" +
			"}\n";

		if (imports.length > 0) {
			fileContents = imports.join("\n") + "\n\n" + fileContents;
		}
		console.log(fileContents, imports);


	}


}
