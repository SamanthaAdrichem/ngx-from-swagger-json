export class LibArray {

	public static distinct(inputArray: any[]): any[] {
		return inputArray.filter((value: any, index: number, self: any[]): boolean => self.indexOf(value) === index);
	}

}
