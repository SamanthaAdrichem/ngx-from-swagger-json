#!/usr/bin/env node
import {readFileSync} from 'fs';
import * as process   from 'process';
import {ConfigModel}  from './config/config.model';
import {Logger}       from './logger';
import {Parser}       from './parser';

const rootPath = process.cwd();
const verbose = true; // @todo read from arguments
const loggerInstance = new Logger(verbose);

// process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0; // Ignore SSL
let parsedCustomConfig: ConfigModel|null = null;
try {
	const customConfig: string = readFileSync(rootPath + '/ngx-from-swagger-json.json', 'utf8');
	try {
		parsedCustomConfig = JSON.parse(customConfig) as ConfigModel;
	}
	catch (error) {
		console.error('Custom config contains invalid JSON', error);
		process.exit(1);
	}
}
catch (error) {
	loggerInstance.log('No custom config set');
}

const config: ConfigModel = new ConfigModel(parsedCustomConfig);
const parser: Parser = new Parser(loggerInstance, config);
parser.parse();
