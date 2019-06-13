import {ParameterInEnum}  from '../models/swagger/parameter-in.enum';
import {ParameterModel}   from '../models/swagger/parameter.model';
import {PropertyTypeEnum} from '../models/swagger/property-type.enum';
import {SchemaTypeEnum}   from '../models/swagger/schema-type.enum';
import {Storage}          from '../storage';
import {Definition}       from './definition';
import {FieldTypeEnum}    from './field-type.enum';

export class Parameter {

	public static fromSwagger(paramName: string, paramModel: ParameterModel): Parameter {
		const parameter: Parameter = new Parameter(
			paramModel.in || null,
			paramName || paramModel.name || '',
			paramModel.name || paramName
		);
		if (paramModel.$ref) {
			parameter.paramRef = paramModel.$ref;
		} else {
			parameter.parseFieldType(paramModel);
		}
		return parameter;
	}

	private paramRef?: string;
	private schemaRef?: string;
	private type?: FieldTypeEnum|null;
	private array: boolean = false;

	constructor(
		private paramSource: ParameterInEnum|null,
		public swaggerName: string,
		public name: string
	) {}

	public getSource(): ParameterInEnum|null {
		if (this.paramRef) {
			const param: Parameter|null = Storage.getParameter(this.paramRef);
			if (param) {
				return param.getSource();
			}
		}
		if (this.schemaRef) {
			const definition: Definition|null = Storage.getDefinition(this.schemaRef);
			if (definition) {
				const modelName: string|null = definition.getModelName();
				if (modelName) {
					return ParameterInEnum.query;
				}
			}
		}
		if (this.paramSource) {
			return this.paramSource;
		}
		return null;
	}

	public getName(): string {
		if (this.paramRef) {
			const param: Parameter|null = Storage.getParameter(this.paramRef);
			if (param) {
				return param.getName();
			}
		}
		if (this.schemaRef) {
			const definition: Definition|null = Storage.getDefinition(this.schemaRef);
			if (definition) {
				const modelName: string|null = definition.getModelName();
				if (modelName) {
					return modelName;
				}
			}
		}
		if (this.name) {
			return this.name;
		}
		return '';
	}

	public getModelFilename(): string|null {
		if (this.paramRef) {
			const param: Parameter|null = Storage.getParameter(this.paramRef);
			if (param) {
				return param.getModelFilename();
			}
		}
		if (this.schemaRef) {
			const definition: Definition|null = Storage.getDefinition(this.schemaRef);
			if (definition) {
				return definition.getModelFilename();
			}
		}
		return null;
	}

	public getType(): FieldTypeEnum {
		if (this.paramRef) {
			const param: Parameter|null = Storage.getParameter(this.paramRef);
			if (param) {
				return param.getType();
			}
		}
		return this.type || FieldTypeEnum.any;
	}

	public getOutputType(): string {
		return this.getType() + (this.array ? '[]' : '');
	}

	public parseFieldType(fieldModel: ParameterModel) {
		if (fieldModel.schema && fieldModel.schema) {
			this.type = fieldModel.schema.type === SchemaTypeEnum.array ? FieldTypeEnum.array : FieldTypeEnum.object;
			this.schemaRef = (fieldModel.schema.items && fieldModel.schema.items.$ref ? fieldModel.schema.items.$ref : fieldModel.schema.$ref) || '';
			return;
		}

		switch (fieldModel.type) {
			case PropertyTypeEnum.boolean:
				this.type = FieldTypeEnum.boolean;
				break;

			case PropertyTypeEnum.number:
			case PropertyTypeEnum.integer:
				this.type = FieldTypeEnum.number;
				break;

			case PropertyTypeEnum.date:
			case PropertyTypeEnum.string:
				this.type = FieldTypeEnum.string;
				break;

			case PropertyTypeEnum.array:
				this.array = true;
				const arrayType: PropertyTypeEnum|string = fieldModel.items && fieldModel.items.type ? fieldModel.items.type : '';
				switch (arrayType) {
					case PropertyTypeEnum.boolean:
						this.type = FieldTypeEnum.boolean;
						break;

					case PropertyTypeEnum.number:
					case PropertyTypeEnum.integer:
						this.type = FieldTypeEnum.number;
						break;

					case PropertyTypeEnum.date:
					case PropertyTypeEnum.string:
						this.type = FieldTypeEnum.string;
						break;

					default:
						console.error('ERROR unknown array type:' + JSON.stringify(fieldModel));
						this.type = FieldTypeEnum.any;
						break;
				}
				break;

			default:
				console.error('ERROR unknown :' + JSON.stringify(fieldModel));
				this.type = FieldTypeEnum.any;
				break;
		}
	}

	public export(exportDestination: string): boolean {
		if (!this.schemaRef) {
			return false;
		}
		const definition: Definition|null = Storage.getDefinition(this.schemaRef);
		if (!definition) {
			return false;
		}
		definition.export(exportDestination);
		return true;
	}
}

// public export(exportDestination: string): void {
// 	const definition: Definition|null = Storage.getDefinition(this.ref || '');
// 	if (!definition) {
// 		return;
// 	}
// 	return definition.export(exportDestination);
// }
