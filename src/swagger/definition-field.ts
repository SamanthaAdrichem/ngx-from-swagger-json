import {LibString}        from '../lib/string';
import {PropertyTypeEnum} from '../models/swagger/property-type.enum';
import {PropertyModel}    from '../models/swagger/property.model';
import {Storage}          from '../storage';
import {Definition}       from './definition';
import {FieldTypeEnum}    from './field-type.enum';

export class DefinitionField {
	public static fromSwagger(fieldName: string, fieldModel: PropertyModel): DefinitionField {
		const definitionField = new DefinitionField(fieldName);
		definitionField.parseFieldType(fieldModel);
		return definitionField;
	}

	public name: string = '';
	public fieldType?: FieldTypeEnum;
	public subFieldType?: FieldTypeEnum;
	public subFieldRef?: string;
	public enumValues?: string[]|number[];

	constructor(name: string) {
		this.name = this.safeName(name);
	}

	public safeName(name: string) {
		if (parseInt(name.toString().substr(0,1), 10)) {
			return "'" + name + "'";
		}
		return name;
	}

	public parseFieldType(fieldModel: PropertyModel) {
		let fieldType: PropertyTypeEnum|string = (fieldModel.type || '').toLowerCase();

		if (!fieldModel.type &&
			(
				(fieldModel.items && fieldModel.items.$ref)
				|| fieldModel.$ref
			)
		)
		{
			fieldType = PropertyTypeEnum.object;
			if (fieldModel.$ref) {
				if (!fieldModel.items) {
					fieldModel.items = {};
				}
				fieldModel.items.$ref = fieldModel.$ref;
			}
		}

		if (fieldModel.enum) {
			fieldType = 'enum';
		}

		switch (fieldType)
		{
			case PropertyTypeEnum.boolean:
				this.fieldType = FieldTypeEnum.boolean;
				break;

			case PropertyTypeEnum.number:
			case PropertyTypeEnum.integer:
				this.fieldType = FieldTypeEnum.number;
				break;

			case PropertyTypeEnum.date:
			case PropertyTypeEnum.string:
				this.fieldType = FieldTypeEnum.string;
				break;

			case 'enum':
				this.fieldType = FieldTypeEnum.enum;
				this.parseSubFieldType(fieldModel);
				if (fieldModel.enum) {
					this.enumValues = fieldModel.enum;
				}
				break;

			case 'array':
				if (fieldModel.items) {
					this.parseSubFieldType(fieldModel.items);
				}
				this.fieldType = FieldTypeEnum.array;
				break;

			case 'object':
				if (fieldModel.items) {
					this.parseSubFieldType(fieldModel.items);
				}
				this.fieldType = FieldTypeEnum.object;
				break;

			default:
				console.error('ERROR unknown :' + JSON.stringify(fieldModel));
				this.fieldType = FieldTypeEnum.any;
				break;
		}
	}

	public parseSubFieldType(subFieldType: PropertyModel) {
		if (subFieldType.$ref) {
			this.subFieldRef = subFieldType.$ref;
			this.subFieldType = FieldTypeEnum.object;
			return;
		}
		switch (subFieldType.type) {
			case PropertyTypeEnum.boolean:
				this.subFieldType = FieldTypeEnum.boolean;
				break;

			case PropertyTypeEnum.number:
			case PropertyTypeEnum.integer:
				this.subFieldType = FieldTypeEnum.number;
				break;

			case PropertyTypeEnum.date:
			case PropertyTypeEnum.string:
				this.subFieldType = FieldTypeEnum.string;
				break;

			default:
				console.error('ERROR unknown subfield: ' + JSON.stringify(subFieldType));
				this.subFieldType = FieldTypeEnum.any;
				break;
		}
	}

	public getType(): FieldTypeEnum|null {
		return this.fieldType || null;
	}

	public getSubFieldType(): FieldTypeEnum {
		if (this.subFieldType) {
			return this.subFieldType;
		}
		return FieldTypeEnum.any;
	}

	public getModelName(): string|null {
		if (this.enumValues) {
			return this.getEnumName();
		}
		if (this.subFieldRef) {
			const refDefinition: Definition|null = Storage.getDefinition(this.subFieldRef);
			if (refDefinition) {
				return refDefinition.getModelName();
			}
		}
		return null;
	}

	public getModelFileName(): string|null {
		if (this.enumValues) {
			return this.getEnumFileName();
		}
		if (this.subFieldRef) {
			const refDefinition: Definition|null = Storage.getDefinition(this.subFieldRef);
			if (refDefinition) {
				return refDefinition.getModelFileName();
			}
		}
		return null;
	}

	public getEnumName(): string {
		return LibString.upperCamelCaseName(this.name) + 'Enum';
	}

	public getEnumFileName(): string {
		return LibString.dashCaseName(this.name) + '.enum.ts';
	}

	public isRequired(): boolean {
		return false; // @todo
	}

	public export(exportDestination: string): void {
		if (this.enumValues) {
			// export enum
		}
		if (this.subFieldRef) {
			const refDefinition: Definition|null = Storage.getDefinition(this.subFieldRef);
			if (refDefinition) {
				refDefinition.export(exportDestination);
			}
		}
	}

}
