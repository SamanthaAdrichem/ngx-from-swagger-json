export class LibObject {

	public static addKeyedValue(inputArray: {[key:string]:any[]}, key: string, value: any): {[key:string]:any[]} {
		if (!inputArray[key]) {
			inputArray[key] = [];
		}
		inputArray[key].push(value);
		return inputArray;
	}
}
