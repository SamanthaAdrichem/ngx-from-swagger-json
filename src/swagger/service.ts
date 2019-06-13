import {LibFile}       from '../lib/file';
import {LibObject}     from '../lib/object';
import {LibString}     from '../lib/string';
import {PathModel}     from '../models/swagger/path.model';
import {Storage}       from '../storage';
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
			for (const methodName in serviceMethods) {
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
	private serviceDirectory: string = '';

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

	public getServiceDirectory(): string {
		return this.serviceDirectory;
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

	public export(): void {
		const serviceName: string|null = this.getServiceName();
		const serviceFilename: string|null = this.getServiceFilename();
		if (null === serviceName || null === serviceFilename) {
			console.warn('Could not export empty service', this);
			return;
		}
		this.setServiceDirectory();

		const imports: {[key: string]:string[]} = {
			'@angular/common/http': ['HttpClient'],
			'@angular/core':        ['Injectable'],
			'rxjs':                 ['Observable']
		};

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
			fileContents += this.generateMethod(this.methods.create, imports);
		}

		if (this.methods.get) {
			fileContents += this.generateMethod(this.methods.get, imports);
		}

		if (this.methods.getById) {
			fileContents += this.generateMethod(this.methods.getById, imports);
		}

		if (this.methods.update) {
			fileContents += this.generateMethod(this.methods.update, imports);
		}

		if (this.methods.remove) {
			fileContents += this.generateMethod(this.methods.remove, imports);
		}

		fileContents += "" +
			"}\n";

		fileContents = LibFile.generateImportStatements(imports) + fileContents;
		LibFile.writeFile(this.getServiceDirectory() + '/' + this.getServiceFilename(), fileContents);

	}

	private setServiceDirectory(): void {
		// const serviceDirectory: string[] = this.servicePath.split('/');
		// serviceDirectory.pop();
		let servicePath: string = this.servicePath;
		if (Storage.skipPath !== '') {
			if (servicePath.startsWith(Storage.skipPath)) {
				servicePath = servicePath.substr(Storage.skipPath.length + 1);
			}
		}
		this.serviceDirectory = LibFile.removeOuterSlashes(LibFile.removeOuterSlashes(Storage.config.getDestinationDir()) + '/' + LibFile.removeOuterSlashes(servicePath));
	}

	private getMethodResponseModel(method: Method, imports: {[key: string]:string[]}): string {
		let responseModel: string = 'void';
		if (method.response) {
			responseModel = method.response.getModelName() || responseModel;
			if ('void' !== responseModel) {
				if (method.response.getType() === FieldTypeEnum.array) {
					responseModel += '[]';
				}
				method.response.export(this.getServiceDirectory());
				const importPath: string|null = method.response.getModelFilename();
				if (null !== importPath) {
					LibObject.addKeyedValue(imports, this.getServiceDirectory() + '/' + importPath.replace('.ts', ''), method.response.getModelName() || '');
				}
			}
		}
		return responseModel;
	}

	private getPathParams() {
		const pathParams: string[] = [];
		this.pathParams.map((parameter: Parameter) => {
			pathParams.push(LibString.camelCaseName(parameter.getName()) + ': ' + parameter.getOutputType());
		});
		return pathParams.join(', ');
	}

	private generateMethod(method: Method, imports: {[key: string]: string[]}): string {
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
				requestParams += (requestParams.length > 0 ? ', ' : ' ') + idParamName + ': ' + this.idParam.getOutputType();
				apiPath = apiPath.substr(0, apiPath.length - 1) + "/' + " + idParamName;
			}
		}

		if (method.exportBody(this.getServiceDirectory())) {
			hasBody = true;
			requestParams += (requestParams.length > 0 ? ', ' : ' ') + 'body: ' + method.getBodyName();
			const bodyImportPath: string|null = method.getBodyModelFilename();
			if (bodyImportPath) {
				LibObject.addKeyedValue(imports, this.getServiceDirectory() + '/' + bodyImportPath.replace('.ts', ''), method.getBodyName() || '');
			}
		} else if (method.exportFilter(method.name, serviceName, serviceFilename, this.getServiceDirectory())) {
			hasFilter = true;

			const filterName: string = method.getFilterName(method.name, serviceName);
			requestParams += (requestParams.length > 0 ? ', ' : ' ') + 'filter: ' + filterName;
			const filterImportPath: string|null = method.getFilterFilename(method.name,serviceFilename || '').replace('.ts', '');
			if (filterImportPath) {
				LibObject.addKeyedValue(imports, this.getServiceDirectory() + '/' + filterImportPath.replace('.ts', ''), filterName);
			}
		}

		if (hasFilter) {
			LibObject.addKeyedValue(imports, '@angular/common/http', 'HttpParams');
			LibObject.addKeyedValue(imports, '@angular/common/http/src/params', 'HttpParamsOptions');
		}

		const responseModel: string = this.getMethodResponseModel(method, imports);
		return "" +
			"\t" + method.name + "(" + requestParams + "): Observable<" + responseModel + "> {\n" +
			"\t\treturn this.httpClient." + method.apiAction + "<" + responseModel + ">(\n" +
			"\t\t\t" + apiPath + (hasFilter || hasBody ? ',' : '') + "\n" +
			(hasBody ? "\t\t\tbody\n" : "") +
			(hasFilter ? "\t\t\t{params: new HttpParams(<HttpParamsOptions>{fromObject: filter as {}})}\n" : "") +
			"\t\t);\n" +
			"\t}\n" +
			"\n";
	}
}
