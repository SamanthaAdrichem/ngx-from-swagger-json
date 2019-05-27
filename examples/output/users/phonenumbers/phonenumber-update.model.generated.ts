import {TypeEnum} from 'examples/output/users/phonenumbers/type.enum';

export class PhonenumberUpdateModelGenerated {

	public country_id?: number;
	public number?: string;
	public type?: TypeEnum;

	constructor(values?: PhonenumberUpdateModelGenerated) {
		Object.assign(this, values || {});
	}

}
