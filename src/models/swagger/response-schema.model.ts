import {ResponseSchemaItemsModel} from './response-schema-items.model';
import {ResponseSchemaTypeEnum}   from './response-schema-type.enum';

export class ResponseSchemaModel {
	public type?: ResponseSchemaTypeEnum;
	public items?: ResponseSchemaItemsModel;
	public $ref?: string;
}
