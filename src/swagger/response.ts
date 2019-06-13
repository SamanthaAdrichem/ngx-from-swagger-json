import {SchemaModel}    from 'models/swagger/schema.model';
import {ResponseModel}  from '../models/swagger/response.model';
import {SchemaTypeEnum} from '../models/swagger/schema-type.enum';
import {Storage}        from '../storage';
import {Definition}     from './definition';
import {FieldTypeEnum}  from './field-type.enum';

export class Response {

	public static fromSwagger(code: number, responseModel: ResponseModel): Response {
		const response: Response = new Response(code);

		if (responseModel.schema) {
			response.setType(responseModel.schema.type === SchemaTypeEnum.array ? FieldTypeEnum.array : FieldTypeEnum.object);
			response.setRef((responseModel.schema.items && responseModel.schema.items.$ref ? responseModel.schema.items.$ref : responseModel.schema.$ref) || '');
		}
		if (responseModel.content && Object.keys(responseModel.content).length > 0) {
			const schema: SchemaModel = responseModel.content[Object.keys(responseModel.content)[0]].schema;
			if (schema) {
				response.setType(schema.type === SchemaTypeEnum.array ? FieldTypeEnum.array : FieldTypeEnum.object);
				response.setRef((schema.items && schema.items.$ref ? schema.items.$ref : schema.$ref) || '');
			}
		}
		return response;
	}

	private type?: FieldTypeEnum;
	private ref?: string;

	constructor(
		public responseCode: number
	) {}

	public setType(type: FieldTypeEnum): void {
		this.type = type;
	}

	public getType(): FieldTypeEnum|null {
		return this.type || null;
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

	public getModelFilename(): string|null {
		const definition: Definition|null = Storage.getDefinition(this.ref || '');
		if (!definition) {
			return null;
		}
		return definition.getModelFilename();
	}

	public export(exportDestination: string): void {
		const definition: Definition|null = Storage.getDefinition(this.ref || '');
		if (!definition) {
			return;
		}
		return definition.export(exportDestination);
	}

}
