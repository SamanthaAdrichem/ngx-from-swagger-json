import {LibFile}          from '../lib/file';
import {LibString}        from '../lib/string';
import {Logger}           from '../logger';
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
	public enumValues?: string[]|number[]|boolean[];

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

		if (fieldModel.enum && fieldModel.type !== PropertyTypeEnum.array) {
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
				if (fieldModel.enum) {
					this.enumValues = fieldModel.enum;
					this.parseSubFieldType(fieldModel, fieldModel.items || undefined);
				} else if (fieldModel.items) {
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
				this.fieldType = FieldTypeEnum.any;
				break;
		}
	}

	public parseSubFieldType(subFieldType: PropertyModel, altSubFieldType?: PropertyModel) {
		if (subFieldType.$ref) {
			this.subFieldRef = subFieldType.$ref;
			this.subFieldType = FieldTypeEnum.object;
			return;
		}
		if (!subFieldType.type && altSubFieldType && altSubFieldType.$ref) {
			this.subFieldRef = altSubFieldType.$ref;
			this.subFieldType = FieldTypeEnum.object;
			return;
		}

		const type: PropertyTypeEnum|null = (subFieldType.type !== PropertyTypeEnum.array ? subFieldType.type : null) || (altSubFieldType ? altSubFieldType.type : null) || null;
		switch (type) {
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

	public getModelFilename(): string|null {
		if (this.enumValues) {
			return this.getEnumFilename();
		}
		if (this.subFieldRef) {
			const refDefinition: Definition|null = Storage.getDefinition(this.subFieldRef);
			if (refDefinition) {
				return refDefinition.getModelFilename();
			}
		}
		return null;
	}

	public getEnumName(): string {
		return LibString.upperCamelCaseName(this.name) + 'Enum';
	}

	public getEnumFilename(): string {
		return LibString.dashCaseName(this.name) + '.enum.ts';
	}

	public isRequired(): boolean {
		return false; // @todo
	}

	public export(exportDestination: string): void {
		if (this.enumValues) {
			exportDestination = LibFile.removeOuterSlashes(exportDestination);
			const enumName: string = this.getEnumName() || '';
			const enumFilename: string = this.getEnumFilename() || '';

			if (!enumName) {
				return;
			}

			let maxEnumLength: number = 0;
			for (const enumValue of this.enumValues) {
				const safeEnumName = LibString.safeEnumName(enumValue.toString());
				let enumLength: number = safeEnumName.length;
				if (typeof enumValue !== 'boolean' && (typeof enumValue === 'number' || !isNaN(parseInt(safeEnumName.substr(0, 1), 10)))) {
					enumLength += 2;
				}
				maxEnumLength = enumLength > maxEnumLength ? enumLength : maxEnumLength;
			}

			const enumValues: string[] = [];
			for (const enumValue of this.enumValues) {
				if (typeof enumValue === 'boolean') { // Should not really be an enum then... but hey..
					if (enumValue) {
						enumValues.push("TRUE".padEnd(maxEnumLength, ' ') + " = 'true'");
					} else {
						enumValues.push("FALSE".padEnd(maxEnumLength, ' ') + " = 'false'");
					}
					continue;
				}

				const safeEnumName = LibString.safeEnumName(enumValue.toString());
				if (typeof enumValue === 'number') {
					enumValues.push(("'" + safeEnumName.toString() + "'").padEnd(maxEnumLength, ' ') + " = " + enumValue);
					continue;
				}

				if (!isNaN(parseInt(safeEnumName.substr(0, 1), 10))) {
					enumValues.push(("'" + safeEnumName.toString().toUpperCase() + "'").padEnd(maxEnumLength, ' ') + " = '" + enumValue + "'");
					continue;
				}
				enumValues.push(safeEnumName.toString().toUpperCase().padEnd(maxEnumLength, ' ') + " = '" + enumValue + "'");
			}

			const fileContents: string = "" +
				"export enum " + enumName + " {\n" +
				"\t" + enumValues.join(",\n\t") + "\n" +
				"}\n";
			Logger.log('Generated enum model: ' + enumName);
			Logger.log(fileContents);
			LibFile.writeFile(exportDestination + '/' + enumFilename, fileContents, true);
		}

		if (this.subFieldRef) {
			const refDefinition: Definition|null = Storage.getDefinition(this.subFieldRef);
			if (refDefinition) {
				refDefinition.export(exportDestination);
			}
		}
	}

}
