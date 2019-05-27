import {HttpClient}             from '@angular/common/http';
import {Injectable}             from '@angular/core';
import {PhonenumberUpdateModel} from 'examples/output/users/phonenumbers/phonenumber-update.model.ts';
import {PhonenumberModel}       from 'examples/output/users/phonenumbers/phonenumber.model.ts';
import {Observable}             from 'rxjs';

@Injectable()
export class PhonenumbersService {

	constructor(
		private httpClient: HttpClient
	) {}

	create(userId: number, body: PhonenumberUpdateModel): Observable<PhonenumberModel> {
		return this.httpClient.post<PhonenumberModel>(
			'/users/' + userId + '/phonenumbers',
			body
		);
	}

	get(userId: number): Observable<PhonenumberModel> {
		return this.httpClient.get<PhonenumberModel>(
			'/users/' + userId + '/phonenumbers'
		);
	}

	getById(userId: number, phonenumberId: number): Observable<PhonenumberModel> {
		return this.httpClient.get<PhonenumberModel>(
			'/users/' + userId + '/phonenumbers/' + phonenumberId
		);
	}

	update(userId: number, phonenumberId: number, body: PhonenumberUpdateModel): Observable<PhonenumberModel> {
		return this.httpClient.put<PhonenumberModel>(
			'/users/' + userId + '/phonenumbers/' + phonenumberId,
			body
		);
	}

	remove(userId: number, phonenumberId: number): Observable<void> {
		return this.httpClient.delete<void>(
			'/users/' + userId + '/phonenumbers/' + phonenumberId
		);
	}

}
