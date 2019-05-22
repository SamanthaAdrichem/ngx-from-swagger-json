import {MethodModel} from './method.model';

export class PathModel {
	public delete?: MethodModel;
	public get?: MethodModel;
	public patch?: MethodModel;
	public post?: MethodModel;
	public put?: MethodModel;

	constructor(config?: PathModel|null) {
		Object.assign(this, config);
	}
}
