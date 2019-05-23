import {LibString}               from '../lib/string';
import {PropertyTypeEnum}        from '../models/swagger/property-type.enum';
import {PropertyModel}           from '../models/swagger/property.model';
import {Storage}                 from '../storage';
import {Definition}              from './definition';
import {DefinitionFieldTypeEnum} from './definition-field-type.enum';

export class DefinitionField {
	public static fromSwagger(fieldName: string, fieldModel: PropertyModel): DefinitionField {
		const definitionField = new DefinitionField(fieldName);
		definitionField.parseFieldType(fieldModel);
		return definitionField;
	}

	public name: string = '';
	public fieldType?: DefinitionFieldTypeEnum;
	public subFieldType?: DefinitionFieldTypeEnum;
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
				this.fieldType = DefinitionFieldTypeEnum.boolean;
				break;

			case PropertyTypeEnum.number:
			case PropertyTypeEnum.integer:
				this.fieldType = DefinitionFieldTypeEnum.number;
				break;

			case PropertyTypeEnum.date:
			case PropertyTypeEnum.string:
				this.fieldType = DefinitionFieldTypeEnum.string;
				break;

			case 'enum':
				this.fieldType = DefinitionFieldTypeEnum.enum;
				this.parseSubFieldType(fieldModel);
				if (fieldModel.enum) {
					this.enumValues = fieldModel.enum;
				}
				break;

			case 'array':
				if (fieldModel.items) {
					this.parseSubFieldType(fieldModel.items);
				}
				this.fieldType = DefinitionFieldTypeEnum.array;
				break;

			case 'object':
				if (fieldModel.items) {
					this.parseSubFieldType(fieldModel.items);
				}
				this.fieldType = DefinitionFieldTypeEnum.object;
				break;

			default:
				console.error('ERROR unknown :' + JSON.stringify(fieldModel));
				this.fieldType = DefinitionFieldTypeEnum.any;
				break;
		}
	}

	public parseSubFieldType(subFieldType: PropertyModel) {
		if (subFieldType.$ref) {
			this.subFieldRef = subFieldType.$ref;
			this.subFieldType = DefinitionFieldTypeEnum.object;
			return;
		}
		switch (subFieldType.type) {
			case PropertyTypeEnum.boolean:
				this.subFieldType = DefinitionFieldTypeEnum.boolean;
				break;

			case PropertyTypeEnum.number:
			case PropertyTypeEnum.integer:
				this.subFieldType = DefinitionFieldTypeEnum.number;
				break;

			case PropertyTypeEnum.date:
			case PropertyTypeEnum.string:
				this.subFieldType = DefinitionFieldTypeEnum.string;
				break;

			default:
				console.error('ERROR unknown subfield: ' + JSON.stringify(subFieldType));
				this.subFieldType = DefinitionFieldTypeEnum.any;
				break;
		}
	}

	public getType(): DefinitionFieldTypeEnum|null {
		return this.fieldType || null;
	}

	public getSubFieldType(): DefinitionFieldTypeEnum {
		if (this.subFieldType) {
			return this.subFieldType;
		}
		return DefinitionFieldTypeEnum.any;
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
