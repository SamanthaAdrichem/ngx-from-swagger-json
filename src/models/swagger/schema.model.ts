import {SchemaItemsModel} from './schema-items.model';
import {SchemaTypeEnum}   from './schema-type.enum';

export class SchemaModel {
	public type?: SchemaTypeEnum;
	public items?: SchemaItemsModel;
	public $ref?: string;
}
