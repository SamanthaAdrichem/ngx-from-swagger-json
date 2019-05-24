import * as path            from 'path';
import * as process         from 'process';
import {LibFile}            from '../lib/file';
import {LibString}          from '../lib/string';
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
		return this.angularName + 'Model';
	}

	public getImportStatement(importPath: string): string|null {
		let relativePath: string = importPath.replace(path.resolve(process.cwd()), '');
		if (path.sep === '\\') {
			relativePath = relativePath.replace(/\\/g, '/');
		}
		if (relativePath.substr(0, 1) === '/') {
			relativePath = relativePath.substr(1);
		}
		if (relativePath.substr(-1) === '/') {
			relativePath = relativePath.substr(0, relativePath.length - 1);
		}
		if (!this.angularName) {
			return null;
		}
		return "import {" + this.getModelName() + "} from '" + relativePath + '/' + (this.getModelFilename() || '').replace('.ts', '') + "';";
	}

	public getModelFilename(): string|null {
		if (!this.swaggerName) {
			return null
		}
		return LibString.dashCaseName(this.swaggerName) + '.model.ts';
	}

	public export(exportDestination: string) {
		let relativePath: string = exportDestination.replace(path.resolve(process.cwd()), '');
		if (path.sep === '\\') {
			relativePath = relativePath.replace(/\\/g, '/');
		}
		if (relativePath.substr(0, 1) === '/') {
			relativePath = relativePath.substr(1);
		}
		if (relativePath.substr(-1) === '/') {
			relativePath = relativePath.substr(0, relativePath.length - 1);
		}

		const modelName: string = this.getModelName() || '';
		const modelFilename: string = this.getModelFilename() || '';
		const generatedModelName: string = modelName + 'Generated';
		const generatedModelFilename: string = modelFilename.replace('.model.ts', '.model.generated.ts');
		const imports: {[key: string]: string} = {};

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
						imports[relativePath + '/' + fieldModelFilename] = fieldModelName;
						fieldType = fieldModelName;
					}
					break;

				case FieldTypeEnum.array:
					fieldType = field.getSubFieldType();
					if (FieldTypeEnum.object === fieldType) {
						if (fieldModelName && fieldModelFilename) {
							imports[relativePath + '/' + fieldModelFilename] = fieldModelName;
							fieldType = fieldModelName
						}
					}
					fieldType = fieldType + '[]';
					break;
			}
			if (fieldType) {
				generatedFileContents += "\t" + fieldName + (!field.isRequired() ? '?' : '') + ": " + fieldType + ";\n";
			}
		}

		generatedFileContents += "" +
			"\n" +
			"\tconstructor(values?: " + generatedModelName + ") {\n" +
			"\t\tObject.assign(this, values || {});\n" +
			"\t}\n" +
			"\n" +
			"}\n";

		generatedFileContents = LibFile.generateImportStatements(imports) + generatedFileContents;

		const definitionFileContents: string = "" +
			"import {" + generatedModelName + "} from '" + relativePath + '/' + generatedModelFilename.replace('.ts', '') + "';\n\n" +
			"export class " + modelName + " extends " + generatedModelName + " {}\n";

		console.log("OUTPUT: generated definition", "\n" + generatedFileContents);
		console.log("OUTPUT: definition", "\n" + definitionFileContents);

		// fs.writeFile(generatedModelFilename, generatedOutputModel, function(err){
		// 	if (err) {
		// 		console.log(err);
		// 	}
		// 	console.log('Generated: ' + generatedModelFilename);
		// });

		// let modelFilename = __dirname + '/../' + outputDir + '/' + getModelFilename(definitionName, true);
		// if (fs.existsSync(modelFilename)) {
		// 	console.log('Skipped: ' + modelFilename);
		// } else {
		// 	fs.writeFile( modelFilename, outputModel, function ( err ) {
		// 		if ( err ) {
		// 			console.log( err );
		// 		}
		// 		console.log( 'Generated: ' + modelFilename );
		// 	} );
		// }
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
