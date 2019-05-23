import {PropertyFormatEnum} from './property-format.enum';
import {PropertyTypeEnum}   from './property-type.enum';

export class PropertyModel {
	public type?: PropertyTypeEnum;
	public enum?: string[]|number[];
	public format?: PropertyFormatEnum;
	public items?: PropertyModel;
	public $ref?: string;
}
