import {LibFile}            from '../lib/file';
import {LibString}          from '../lib/string';
import {Logger}             from '../logger';
import {DefinitionTypeEnum} from '../models/swagger/definition-type.enum';
import {DefinitionModel}    from '../models/swagger/definition.model';
import {DefinitionField}    from './definition-field';
import {FieldTypeEnum}      from './field-type.enum';

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

	public getModelName(): string|null {
		if (!this.angularName) {
			return null;
		}
		return (!isNaN(parseInt(this.angularName.substr(0,1), 10)) ? '_' : '') + this.angularName + 'Model';
	}

	public getModelFilename(): string|null {
		if (!this.swaggerName) {
			return null
		}
		return LibString.dashCaseName(this.swaggerName) + '.model.ts';
	}

	public export(exportDestination: string) {
		exportDestination = LibFile.removeOuterSlashes(exportDestination);
		const modelName: string = this.getModelName() || '';
		const modelFilename: string = this.getModelFilename() || '';
		const generatedModelName: string = modelName + 'Generated';
		const generatedModelFilename: string = modelFilename.replace('.model.ts', '.model.generated.ts');
		const imports: {[key: string]: string[]} = {};

		if (!modelName) {
			return;
		}

		let generatedFileContents: string = "" +
			"export class " + generatedModelName + " {\n" +
			"\n";

		const fields: {[key: string]:DefinitionField} = this.getFields();

		for (const fieldName in fields) {
			if (!this.fields.hasOwnProperty(fieldName)) {
				continue;
			}
			const field: DefinitionField = this.fields[fieldName];
			const fieldModelName: string|null = field.getModelName();
			const fieldModelFilename: string|null = ((field.getModelFilename() || '').replace('.ts', '')) || null;
			let fieldType: string|null = field.getType();
			switch (fieldType) {
				case FieldTypeEnum.enum:
				case FieldTypeEnum.object:
					field.export(exportDestination);
					if (fieldModelName && fieldModelFilename) {
						if (!imports[exportDestination + '/' + fieldModelFilename]) {
							imports[exportDestination + '/' + fieldModelFilename] = [];
						}
						imports[exportDestination + '/' + fieldModelFilename].push(fieldModelName);
						fieldType = fieldModelName;
					}
					break;

				case FieldTypeEnum.array:
					fieldType = field.getSubFieldType();
					if (FieldTypeEnum.object === fieldType || FieldTypeEnum.enum === fieldType) {
						field.export(exportDestination);
						if (fieldModelName && fieldModelFilename) {
							if (!imports[exportDestination + '/' + fieldModelFilename]) {
								imports[exportDestination + '/' + fieldModelFilename] = [];
							}
							imports[exportDestination + '/' + fieldModelFilename].push(fieldModelName);
							fieldType = fieldModelName
						}
					}
					fieldType = fieldType + '[]';
					break;
			}
			if (fieldType) {
				generatedFileContents += "\tpublic " + fieldName + (!field.isRequired() ? '?' : '') + ': ' + fieldType + ";\n";
			}
		}

		generatedFileContents += "" +
			"\n" +
			"\tconstructor(values?: " + generatedModelName + ") {\n" +
			"\t\tObject.assign(this, values || {});\n" +
			"\t}\n" +
			"\n" +
			"}\n";

		generatedFileContents = "" +
			"// tslint:disable:variable-name\n" +
			"\n" +
			LibFile.generateImportStatements(imports) + generatedFileContents;

		const definitionFileContents: string = "" +
			"import {" + generatedModelName + "} from '" + exportDestination + '/' + generatedModelFilename.replace('.ts', '') + "';\n\n" +
			"export class " + modelName + " extends " + generatedModelName + " {}\n";

		Logger.log('Generated definitionGenerated model: ' + generatedModelName);
		// Logger.log(generatedFileContents);
		LibFile.writeFile(exportDestination + '/' + generatedModelFilename, generatedFileContents, true);

		Logger.log('Generated definitionExtend model: ' + modelName);
		// Logger.log(definitionFileContents);
		LibFile.writeFile(exportDestination + '/' + modelFilename, definitionFileContents);
	}

	public getFields(): {[key: string]: DefinitionField} {
		const returnValue: {[key: string]: DefinitionField} = {};
		for (const fieldName of Object.keys(this.fields).sort()) {
			returnValue[fieldName] = this.fields[fieldName];
		}
		return returnValue;
	}

	private generateAngularName(): void {
		this.angularName = LibString.upperCamelCaseName(this.swaggerName);
	}

}
