import {DefinitionModel} from 'src/models/swagger/definition.model';
import {DefinitionField} from 'src/swagger/definition-field';

export class Definition {
	public static fromSwagger(definitionName: string, definitionModel: DefinitionModel): Definition {
		const definition: Definition = new Definition(definitionName);
		return definition;
	}

	public angularName?: string;
	public fields: {[key: string]: DefinitionField} = {};

	constructor(
		public swaggerName: string
	) {}

}
