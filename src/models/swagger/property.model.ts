import {PropertyFormatEnum} from './property-format.enum';
import {PropertyItemModel}  from './property-item.model';
import {PropertyTypeEnum}   from './property-type.enum';

export class PropertyModel {
	public type?: PropertyTypeEnum;
	public enum?: string|number[];
	public format?: PropertyFormatEnum;
	public items?: PropertyItemModel;
	public $ref?: string;
}
