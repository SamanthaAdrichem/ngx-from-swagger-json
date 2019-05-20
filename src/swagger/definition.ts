import {LibString}          from 'lib/string';
import {DefinitionTypeEnum} from 'models/swagger/definition-type.enum';
import {DefinitionModel}    from 'models/swagger/definition.model';
import {DefinitionField}    from 'swagger/definition-field';

export class Definition {
	public static fromSwagger(definitionName: string, definitionModel: DefinitionModel): Definition {
		const definition: Definition = new Definition(definitionName);
		switch (definitionModel.type) {
			case DefinitionTypeEnum.object:
				if (definitionModel.properties) {
					for (const propertyName in definitionModel.properties) {
						if (!definitionModel.properties.hasOwnProperty(propertyName)) {
							continue;
						}
						definition.addField(DefinitionField.fromSwagger(propertyName, definitionModel.properties[propertyName]));
					}
				}
				break;

			default:
				// Unknown definition type
				break;
		}
		return definition;
	}

	public angularName?: string;
	public fields: {[key: string]: DefinitionField} = {};

	constructor(
		public swaggerName: string
	) {
		this.generateAngularName();
	}

	public addField(field: DefinitionField) {
		this.fields[field.name] = field;
	}

	private generateAngularName(): void {
		this.angularName = LibString.upperCamelCaseName(this.swaggerName);
	}

}
