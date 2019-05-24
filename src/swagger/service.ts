import * as fs         from 'fs';
import * as path       from 'path';
import {LibFile}       from '../lib/file';
import {LibString}     from '../lib/string';
import {PathModel}     from '../models/swagger/path.model';
import {FieldTypeEnum} from './field-type.enum';
import {Method}        from './method';
import {Parameter}     from './parameter';

export class Service {

	public static fromSwagger(swaggerPath: string, methods: PathModel): Service {
		const service: Service = new Service();
		const pathParams = LibString.extractSwaggerParams(swaggerPath);
		const pathParamDict: string[] = [];
		let servicePath: string = swaggerPath;
		let apiPath: string = swaggerPath;
		let idParam: string|null = null;

		pathParams.map((param) => {
			servicePath = servicePath.replace('/' + param, '');

			if (true === swaggerPath.endsWith(param)) {
				idParam = service.parseUrlParam(param);
				apiPath = apiPath.replace(param, '');
				return;
			}
			pathParamDict.push(service.parseUrlParam(param));
			apiPath = apiPath.replace(param , "' + " + LibString.camelCaseName(service.parseUrlParam(param)) + " + '");
		});

		service.setServicePath(servicePath);
		service.setApiPath(apiPath);

		if (servicePath === '/publishers/phonenumbers') {
			// console.log('pathParamDict', pathParamDict);
		}

		if (methods.get) {
			service.addMethod(Method.fromSwagger('get', methods.get, !!idParam));
		}
		if (methods.put) {
			service.addMethod(Method.fromSwagger('put', methods.put, !!idParam));
		}
		if (methods.post) {
			service.addMethod(Method.fromSwagger('post', methods.post, !!idParam));
		}
		if (methods.delete) {
			service.addMethod(Method.fromSwagger('delete', methods.delete, !!idParam));
		}
		if (methods.patch) {
			service.addMethod(Method.fromSwagger('patch', methods.patch, !!idParam));
		}

		const serviceMethods: {[key: string]:Method} = service.getMethods();

		if (idParam) {
			for (const methodName in serviceMethods) {
				if (!serviceMethods.hasOwnProperty(methodName)) {
					continue;
				}
				const parameter: Parameter|null = serviceMethods[methodName].getParameter(idParam);
				if (parameter) {
					service.setIdParam(parameter);
				}
			}
		}

		paramLoop: for (const paramName of pathParamDict) {
			methodLoop: for (const methodName in serviceMethods) {
				if (!serviceMethods.hasOwnProperty(methodName)) {
					continue;
				}
				const parameter: Parameter|null = serviceMethods[methodName].getParameter(paramName);
				if (parameter) {
					service.addPathParam(parameter);
					continue paramLoop;
				}
			}
		}

		return service;
	}

	private apiPath: string = '';
	private idParam?: Parameter;
	private methods: {[key: string]:Method} = {};
	private pathParams: Parameter[] = [];
	private servicePath: string = '';

	public addMethod(method: Method) {
		if (null === method.name) {
			console.error('Method without an action: ', method);
			return;
		}
		this.methods[method.name] = method;
	}

	public getMethods(): {[key: string]:Method} {
		return this.methods;
	}

	public addPathParam(parameter: Parameter): void {
		this.pathParams.push(parameter);
	}

	public setIdParam(idParam: Parameter): void {
		this.idParam = idParam;
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
			if (!this.idParam) {
				this.idParam = service.idParam;
			}
		}
	}

	public getServiceName(): string|null {
		if (!this.servicePath) {
			return null;
		}
		const serviceName: string|undefined = this.servicePath.split('/').pop();
		if (!serviceName) {
			return null;
		}
		return LibString.upperCamelCaseName(serviceName) + 'Service';
	}

	public getServiceFilename(): string|null {
		if (!this.servicePath) {
			return null;
		}
		const serviceName: string|undefined = this.servicePath.split('/').pop();
		if (!serviceName) {
			return null;
		}
		return LibString.dashCaseName(serviceName) + '.service.ts';
	}

	public export(rootExportDestination: string): void {
		const serviceName: string|null = this.getServiceName();
		const serviceFilename: string|null = this.getServiceFilename();
		if (null === serviceName || null === serviceFilename) {
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

		const imports: {[key: string]:string} = {};
		let fileContents: string = '';
		fileContents += "" +
			"@Injectable()\n" +
			"export class " + serviceName + " {\n" +
			"\n" +
			"\tconstructor(\n" +
			"\t\tprivate httpClient: HttpClient\n" +
			"\t) {}\n" +
			"\n";

		if (this.methods.create) {
			fileContents += this.generateMethod(this.methods.create, fullServiceDirectory, imports);
		}

		if (this.methods.get) {
			fileContents += this.generateMethod(this.methods.get, fullServiceDirectory, imports);
		}

		if (this.methods.getById) {
			fileContents += this.generateMethod(this.methods.getById, fullServiceDirectory, imports);
		}

		if (this.methods.update) {
			fileContents += this.generateMethod(this.methods.update, fullServiceDirectory, imports);
		}

		if (this.methods.remove) {
			fileContents += this.generateMethod(this.methods.remove, fullServiceDirectory, imports);
		}

		fileContents += "" +
			"}\n";

		fileContents = LibFile.generateImportStatements(imports) + fileContents;

		console.log("OUTPUT: Service", "\n" + fileContents);

	}

	private getMethodResponseModel(method: Method, fullServiceDirectory: string, imports: {[key: string]:string}): string {
		let responseModel: string = 'void';
		if (method.response) {
			responseModel = method.response.getModelName() || responseModel;
			if ('void' !== responseModel) {
				// @todo
				console.log('ERR: ', method.response.getType());
				if (method.response.getType() === FieldTypeEnum.array) {
					responseModel += '[]';
				}
				method.response.export(fullServiceDirectory);
				const importPath: string|null = method.response.getModelFilename();
				if (null !== importPath) {
					imports[importPath] = method.response.getModelName() || '';
				}
			}
		}
		return responseModel;
	}

	private getPathParams() {
		const pathParams: string[] = [];
		this.pathParams.map((parameter: Parameter) => {
			pathParams.push(LibString.camelCaseName(parameter.getName()) + ': ' + parameter.getType());
		});
		return pathParams.join(', ');
	}

	private generateMethod(method: Method, fullServiceDirectory: string, imports: {[key: string]: string}): string {
		if (!method.name) {
			return '';
		}

		const serviceName: string = this.getServiceName() || '';
		const serviceFilename: string = this.getServiceFilename() || '';

		let requestParams: string = this.getPathParams();
		let hasBody: boolean = false;
		let hasFilter: boolean = false;
		let apiPath: string = "'" + this.apiPath + "'";

		if (this.idParam && method.isIdAction()) {
			const idParamName: string = LibString.camelCaseName(this.idParam.getName());
			if (idParamName) {
				requestParams += (requestParams.length > 0 ? ', ' : ' ') + idParamName + ": " + this.idParam.getType();
				apiPath = apiPath.substr(0, apiPath.length - 1) + "/' + " + idParamName;
			}
		}

		if (method.exportBody(fullServiceDirectory)) {
			hasBody = true;
			requestParams += (requestParams.length > 0 ? ', ' : ' ') + 'body: ' + method.getBodyName();
			const bodyImportStatement: string|null = method.getBodyImportStatement(fullServiceDirectory);
			if (bodyImportStatement) {
				// @todo
			// 	imports.push(bodyImportStatement);
			}
		} else if (method.exportFilter(method.name, serviceName, serviceFilename, fullServiceDirectory)) {
			hasFilter = true;

			const filterName: string = method.getFilterName(method.name, serviceName);
			requestParams += (requestParams.length > 0 ? ', ' : ' ') + 'filter: ' + filterName;
			const filterImportPath: string|null = method.getFilterFilename(method.name,serviceFilename || '').replace('.ts', '');
			if (filterImportPath) {
				imports[filterImportPath] = filterName;
			}
		}

		const responseModel: string = this.getMethodResponseModel(method, fullServiceDirectory, imports);
		return "" +
			"\t" + method.name + "(" + requestParams + "): Observable<" + responseModel + "> {\n" +
			"\t\treturn this.httpClient." + method.apiAction + "<" + responseModel + ">(\n" +
			"\t\t\t" + apiPath + (hasFilter || hasBody ? ',' : '') + "\n" +
			(hasBody ? "\t\t\tbody\n" : "") +
			(hasFilter ? "\t\t\tfilter\n" : "") +
			"\t\t);\n" +
			"\t)\n" +
			"\n";
	}
}
