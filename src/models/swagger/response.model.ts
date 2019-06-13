import {SchemaModel} from './schema.model';

export class ResponseModel {
	public schema?: SchemaModel;
	public content?: {[key:string]:{schema: SchemaModel}};
}
