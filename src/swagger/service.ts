import {LibString}   from 'src/lib/string';
import {PathModel}   from 'src/models/swagger/path.model';
import {Method}      from 'src/swagger/method';

export class Service {

	public static fromSwagger(path: string, methods: PathModel): Service {
		const service: Service = new Service(path);
		const pathParams = LibString.extractSwaggerParams(path);
		let isIdPath: boolean = false;

		pathParams.map((param) => {
			if (true === path.endsWith(param)) {
				service.setIdParam(param);
				isIdPath = true;
				return;
			}
			service.addPathParam(param);
		});

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
		return service;
	}

	private pathParams: string[] = [];
	private idParam?: string;
	private methods: {[key: string]:Method} = {};

	public constructor(private servicePath: string) {}

	public addMethod(method: Method) {
		if (null === method.name) {
			return; // @todo maybe skip it?
		}
		this.methods[method.name] = method;
	}

	public addPathParam(paramName: string): void {
		this.pathParams.push(this.parseUrlParam(paramName));
	}

	public setIdParam(paramName: string): void {
		this.idParam = this.parseUrlParam(paramName);
	}

	public parseUrlParam(paramName: string): string {
		return LibString.camelCaseName(paramName.substr(1, paramName.length -2 ));
	}

	public getServicePath(): string {
		return this.servicePath;
	}

	public merge(service: Service) {
		console.log(service);
	}


}
