import {HttpClient}          from '@angular/common/http';
import {Injectable}          from '@angular/core';
import {UserModel}           from 'examples/output/users/user.model.ts';
import {UsersGetFilterModel} from 'examples/output/users/users-get-filter.model';
import {Observable}          from 'rxjs';

@Injectable()
export class UsersService {

	constructor(
		private httpClient: HttpClient
	) {}

	get(filter: UsersGetFilterModel): Observable<UserModel[]> {
		return this.httpClient.get<UserModel[]>(
			'/users',
			filter
		);
	}

	getById(userId: number): Observable<UserModel> {
		return this.httpClient.get<UserModel>(
			'/users/' + userId
		);
	}

}
