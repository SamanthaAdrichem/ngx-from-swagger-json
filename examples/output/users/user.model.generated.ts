import {PhonenumberModel} from 'examples/output/users/phonenumbers/phonenumber.model';
import {StatusEnum}       from 'examples/output/users/status.enum';
import {TypeEnum}         from 'examples/output/users/type.enum';

export class UserModelGenerated {

	public id?: number;
	public name?: string;
	public phonenumbers?: PhonenumberModel[];
	public status?: StatusEnum;
	public type?: TypeEnum;

	constructor(values?: UserModelGenerated) {
		Object.assign(this, values || {});
	}

}
