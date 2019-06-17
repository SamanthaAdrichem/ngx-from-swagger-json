import * as fs      from 'fs';
import * as path    from 'path';
import * as process from 'process';
import {Logger}     from '../logger';
import {LibArray}   from './array';

export class LibFile {

	public static removeOuterSlashes(inputPath: string): string {
		return inputPath.replace(/^\/|\/$/g, '');
	}

	public static generateImportStatements(imports: {[key: string]: string[]}): string {
		let longestImportLength: number = 1;
		for (const importFilename in imports) {
			if (!imports.hasOwnProperty(importFilename)) {
				continue;
			}
			const importLength: number = LibArray.distinct(imports[importFilename]).sort().join(', ').length;
			longestImportLength = importLength > longestImportLength ? importLength : longestImportLength;
		}
		++longestImportLength;

		const importKeys: string[] = Object.keys(imports).sort();
		if (importKeys.length > 0) {
			const importsSorted: string[] = [];
			for (const importFilename of importKeys) {
				importsSorted.push('import {' + (LibArray.distinct(imports[importFilename]).sort().join(', ') + '}').padEnd(longestImportLength, ' ') + " from '" + importFilename + "';" );
			}
			return LibArray.distinct(importsSorted).join("\n") + "\n\n";
		}
		return '';
	}

	public static replaceDirectorySlashes(filePath: string): string {
		return filePath.replace(/\\/g, '/');
	}

	public static writeFile(relativeFilename: string, fileContents: string, overwrite: boolean = false) {
		relativeFilename = LibFile.replaceDirectorySlashes(relativeFilename);
		const filename: string = relativeFilename.split('/').pop() || '';
		if (!filename) {
			console.error('Invalid file name');
		}

		const filePath: string = path.resolve([
			process.cwd(),
			relativeFilename.substr(0, relativeFilename.length - (filename.length + 1))
		].join('/'));
		if (!fs.existsSync(filePath)) {
			try {
				Logger.log('Creating directory: ' + filePath);
				fs.mkdirSync(path.resolve(filePath), { recursive: true });
			} catch (err) {
				if (err.code !== 'EEXIST') {
					throw err;
				}
			}
		}

		const fullFilename: string = path.resolve(filePath + '/' + filename);
		if (overwrite || !fs.existsSync(fullFilename)) {
			Logger.log('Creating file: ' + fullFilename);
			fs.writeFileSync(fullFilename, fileContents);
		}
	}

}
