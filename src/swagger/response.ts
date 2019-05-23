import {Storage}                from '../storage';
import {Definition}             from './definition';
import {ResponseSchemaTypeEnum} from '../models/swagger/response-schema-type.enum';
import {ResponseModel}          from '../models/swagger/response.model';
import {ResponseTypeEnum}       from './/response-type.enum';

export class Response {

	public static fromSwagger(code: number, responseModel: ResponseModel): Response {
		const response: Response = new Response(code);

		if (responseModel.schema) {
			response.setType(responseModel.schema.type === ResponseSchemaTypeEnum.array ? ResponseTypeEnum.array : ResponseTypeEnum.object);
			response.setRef((responseModel.schema.items && responseModel.schema.items.$ref ? responseModel.schema.items.$ref : responseModel.schema.$ref) || '');
		}
		return response;
	}

	private type?: ResponseTypeEnum;
	private ref?: string;

	constructor(
		public responseCode: number
	) {}

	public setType(type: ResponseTypeEnum): void {
		this.type = type;
	}

	public setRef(ref: string) {
		this.ref = ref;
	}

	public getModelName(): string|null {
		const definition: Definition|null = Storage.getDefinition(this.ref || '');
		if (!definition) {
			return null;
		}
		return definition.getModelName();
	}

	public getImportStatement(rootExportDestination: string): string|null {
		const definition: Definition|null = Storage.getDefinition(this.ref || '');
		if (!definition) {
			return null;
		}
		return definition.getImportStatement(rootExportDestination);
	}

	public export(exportDestination: string): void {
		const definition: Definition|null = Storage.getDefinition(this.ref || '');
		if (!definition) {
			return;
		}
		return definition.export(exportDestination);
	}

}
