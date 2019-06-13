#!/usr/bin/env node
import {readFileSync} from 'fs';
import * as process   from 'process';
import {ConfigModel}  from './config/config.model';
import {Logger}       from './logger';
import {Parser}       from './parser';
import {Storage}      from './storage';

const rootPath = process.cwd();

if (-1 !== process.argv.indexOf('-v') || -1 !== process.argv.indexOf('--verbose')) {
	Logger.verbose = true;
}

let configFile: string = rootPath + '/ngx-from-swagger-json.json';
const configIndex: number = process.argv.indexOf('--config');
if (-1 !== configIndex) {
	if ("string" !== typeof process.argv[configIndex + 1]) {
		console.error('Invalid custom config file');
		process.exit(1);
	}
	configFile = process.argv[configIndex + 1];
}

let parsedCustomConfig: ConfigModel[]|null = null;
try {
	const customConfig: string = readFileSync(configFile, 'utf8');
	try {
		parsedCustomConfig = JSON.parse(customConfig) as ConfigModel[];
	}
	catch (error) {
		console.error('Config file contains invalid JSON', "\n\n", error);
		process.exit(1);
	}
}
catch (error) {
	console.error('No custom config set', "\n\n", error);
	process.exit(1);
}

let entryIndex = 0;
processConfigEntry();

function processConfigEntry() {
	if (null === parsedCustomConfig) {
		return;
	}

	if (parsedCustomConfig[entryIndex]) {
		Logger.log('Processing entry ' + entryIndex);
		Storage.clear();
		Storage.config = new ConfigModel(parsedCustomConfig[entryIndex]);
		entryIndex++;

		// Ignore SSL
		if (Storage.config.ignoreTls) {
			Logger.log('Disabling SSL check for entry');
			process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
		} else {
			Logger.log('Enabling SSL check for entry');
			process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';
		}

		const parser: Parser = new Parser();
		parser.parse()
			.then(processConfigEntry)
			.catch((resp) => console.error(resp));
	}
}
