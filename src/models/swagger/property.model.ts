import {PropertyFormatEnum} from 'models/swagger/property-format.enum';
import {PropertyItemModel}  from 'models/swagger/property-item.model';
import {PropertyTypeEnum}   from 'models/swagger/property-type.enum';

export class PropertyModel {
	public type?: PropertyTypeEnum;
	public enum?: string|number[];
	public format?: PropertyFormatEnum;
	public items?: PropertyItemModel;
	public $ref?: string;
}
