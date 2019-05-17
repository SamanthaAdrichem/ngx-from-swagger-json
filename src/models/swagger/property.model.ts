import {PropertyFormatEnum} from 'src/models/swagger/property-format.enum';
import {PropertyTypeEnum}   from 'src/models/swagger/property-type.enum';

export class PropertyModel {
	public type?: PropertyTypeEnum;
	public enum?: string|number[];
	public format?: PropertyFormatEnum;
}
