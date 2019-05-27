import {TypeEnum} from 'examples/output/users/phonenumbers/type.enum';

export class PhonenumberModelGenerated {

	public country_code?: string;
	public country_id?: number;
	public id?: number;
	public number?: string;
	public type?: TypeEnum;

	constructor(values?: PhonenumberModelGenerated) {
		Object.assign(this, values || {});
	}

}
