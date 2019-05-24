import * as fs      from 'fs';
import * as path    from 'path';
import * as process from "process";
import {LibArray}   from '../lib/array';
import {LibString}  from '../lib/string';
import {PathModel}  from '../models/swagger/path.model';
import {Method}     from './method';
import {Parameter}  from './parameter';

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

	public getServiceFileName(): string|null {
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
		const serviceFilename: string|null = this.getServiceFileName();
		if (null === serviceName || null === serviceFilename) {
			console.warn('Could not export empty service', this);
			return;
		}

		const serviceDirectory: string = this.getServiceDirectory() || '';
		const fullServiceDirectory: string = rootExportDestination + serviceDirectory;
		let relativePath: string = fullServiceDirectory.replace(path.resolve(process.cwd()), '');
		if (path.sep === '\\') {
			relativePath = relativePath.replace(/\\/g, '/');
		}
		if (relativePath.substr(0, 1) === '/') {
			relativePath = relativePath.substr(1);
		}
		if (relativePath.substr(-1) === '/') {
			relativePath = relativePath.substr(0, relativePath.length - 1);
		}


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
		const pathParams: string[] = [];
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

// @todo response model array!
// @todo fix all import statements

		if (this.methods.get) {
			const method: Method = this.methods.get;
			let hasFilter: boolean = false;
			let requestParams: string = pathParams.join(', ');
			if (method.exportFilter(serviceName, serviceFilename, fullServiceDirectory)) {
				requestParams += (requestParams.length > 0 ? ', ' : ' ') + 'filter: ' + method.getFilterName(serviceName);
				const filterImportPath: string|null = method.getFilterFileName(serviceFilename || '').replace('.ts', '');
				if (filterImportPath) {
					imports[filterImportPath] = "import {" + method.getFilterName(serviceName) + "} from '" + relativePath + '/' + filterImportPath + "';";
				}
				hasFilter = true;
			}
			let responseModel: string = 'void';
			if (method.response) {
				responseModel = method.response.getModelName() || responseModel;
				if ('void' !== responseModel) {
					method.response.export(fullServiceDirectory);
					// const importFileName: string|null = method.response.getImportStatement(fullServiceDirectory);
					// if (null !== importFileName) {
					// 	imports[importFileName] = importFileName;
					// }
				}
			}
			fileContents += "" +
				"\tget(" + requestParams + "): Observable<" + responseModel + "> {\n" +
				"\t\treturn this.httpClient.get<" + responseModel + ">(\n" +
				"\t\t\t'" + this.apiPath + (hasFilter ? ',' : '') + "'\n" +
				(hasFilter ? "\t\t\tfilter || {}\n" : "") +
				"\t\t);\n" +
				"\t)\n" +
				"\n";
		}

		if (this.methods.getById && this.idParam) {
			const method: Method = this.methods.getById;

			let requestParams: string = pathParams.join(', ');
			const idParamName: string = LibString.camelCaseName(this.idParam.getName());
			if (idParamName) {
				requestParams += (requestParams.length > 0 ? ', ' : ' ') + idParamName + ": " + this.idParam.getType();
			}

			let responseModel: string = 'void';
			if (method.response) {
				responseModel = method.response.getModelName() || responseModel;
				if ('void' !== responseModel) {
					method.response.export(fullServiceDirectory);
					// const importStatement: string|null = method.response.getImportStatement(fullServiceDirectory);
					// if (null !== importStatement) {
					// 	imports.push(importStatement);
					// }
				}
			}

			fileContents += "" +
				"\tgetById(" + requestParams + "): Observable<" + responseModel + "> {\n" +
				"\t\treturn this.httpClient.get<" + responseModel + ">(\n" +
				"\t\t\t'" + this.apiPath + "/' + " + idParamName + "\n" +
				"\t\t);\n" +
				"\t)\n" +
				"\n";
		}

		if (this.methods.create) {
			const method: Method = this.methods.create;

			let requestParams: string = pathParams.join(', ');
			if (method.exportBody(fullServiceDirectory)) {
				requestParams += (requestParams.length > 0 ? ', ' : ' ') + 'body: ' + method.getBodyName();
				// const bodyImportStatement: string|null = method.getBodyImportStatement(fullServiceDirectory);
				// if (bodyImportStatement) {
				// 	imports.push(bodyImportStatement);
				// }
			}
			let responseModel: string = 'void';
			if (method.response) {
				responseModel = method.response.getModelName() || responseModel;
				if ('void' !== responseModel) {
					method.response.export(fullServiceDirectory);
					// const importStatement: string|null = method.response.getImportStatement(fullServiceDirectory);
					// if (null !== importStatement) {
					// 	imports.push(importStatement);
					// }
				}
			}

			fileContents += "" +
				"\tcreate(" + requestParams + "): Observable<" + responseModel + "> {\n" +
				"\t\treturn this.httpClient.post<" + responseModel + ">(\n" +
				"\t\t\t'" + this.apiPath + "',\n" +
				"\t\t\tbody\n" +
				"\t\t);\n" +
				"\t)\n" +
				"\n";
		}

		if (this.methods.update && this.idParam) {
			const method: Method = this.methods.update;

			let requestParams: string = pathParams.join(', ');
			const idParamName: string = LibString.camelCaseName(this.idParam.getName());
			if (idParamName) {
				requestParams += (requestParams.length > 0 ? ', ' : ' ') + idParamName + ": " + this.idParam.getType();
			}

			if (method.exportBody(fullServiceDirectory)) {
				requestParams += (requestParams.length > 0 ? ', ' : ' ') + 'body: ' + method.getBodyName();
				// const bodyImportStatement: string|null = method.getBodyImportStatement(fullServiceDirectory);
				// if (bodyImportStatement) {
				// 	imports.push(bodyImportStatement);
				// }
			}
			let responseModel: string = 'void';
			if (method.response) {
				responseModel = method.response.getModelName() || responseModel;
				if ('void' !== responseModel) {
					method.response.export(fullServiceDirectory);
					// const importStatement: string|null = method.response.getImportStatement(fullServiceDirectory);
					// if (null !== importStatement) {
					// 	imports.push(importStatement);
					// }
				}
			}

			fileContents += "" +
				"\tupdate(" + requestParams + "): Observable<" + responseModel + "> {\n" +
				"\t\treturn this.httpClient.put<" + responseModel + ">(\n" +
				"\t\t\t'" + this.apiPath + "/' + " + idParamName + ",\n" +
				"\t\t\tbody\n" +
				"\t\t);\n" +
				"\t)\n" +
				"\n";
		}

		if (this.methods.remove && this.idParam) {
			const method: Method = this.methods.remove;

			let requestParams: string = pathParams.join(', ');
			const idParamName: string = LibString.camelCaseName(this.idParam.getName());
			if (idParamName) {
				requestParams += (requestParams.length > 0 ? ', ' : ' ') + idParamName + ": " + this.idParam.getType();
			}

			let responseModel: string = 'void';
			if (method.response) {
				responseModel = method.response.getModelName() || responseModel;
				if ('void' !== responseModel) {
					method.response.export(fullServiceDirectory);
					// const importStatement: string|null = method.response.getImportStatement(fullServiceDirectory);
					// if (null !== importStatement) {
					// 	imports.push(importStatement);
					// }
				}
			}

			fileContents += "" +
				"\tremove(" + requestParams + "): Observable<" + responseModel + "> {\n" +
				"\t\treturn this.httpClient.delete<" + responseModel + ">(\n" +
				"\t\t\t'" + this.apiPath + "/' + " + idParamName + "\n" +
				"\t\t);\n" +
				"\t)\n" +
				"\n";
		}

		fileContents += "" +
			"}\n";

		const importKeys: string[] = Object.keys(imports).sort();
		if (importKeys.length > 0) {
			const importsSorted: string[] = [];
			for (const importName of importKeys) {
				importsSorted.push(imports[importName]);
			}
			fileContents = LibArray.distinct(importsSorted).join("\n") + "\n\n" + fileContents
		}

		console.log(fileContents, imports);


	}


}
