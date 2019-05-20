import {PropertyTypeEnum}        from 'models/swagger/property-type.enum';
import {PropertyModel}           from 'models/swagger/property.model';
import {DefinitionFieldTypeEnum} from 'swagger/definition-field-type.enum';

export class DefinitionField {
	public static fromSwagger(fieldName: string, fieldModel: PropertyModel): DefinitionField {
		const definitionField = new DefinitionField(fieldName);
		definitionField.parseFieldType(fieldModel);
		return definitionField;
	}

	public name: string = '';
	public fieldType?: DefinitionFieldTypeEnum;

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
				console.log('ENUM: ', fieldModel);
				break;
				// @todo fix it
				// return fieldModel.enumModel;

			case 'array':
				this.fieldType = DefinitionFieldTypeEnum.array;
				console.log('ARRAY: ', fieldModel.items);
				break;

			case 'object':
				this.fieldType = DefinitionFieldTypeEnum.object;
				console.log('OBJECT: ', fieldModel.items);
				break;

			default:
				console.log('ERROR unknown :' + JSON.stringify(fieldModel));
				break;
		}
	}

}
