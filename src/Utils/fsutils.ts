import { parse, sep } from 'path';
import { DebugProtocol } from 'vscode-debugprotocol';
import * as fs from 'fs';

const MATLAB_EXT = '.m';
const PKG_REGEX = new RegExp(`(\\+.+[\\${sep}]?)*$`);


//**************************************************************************
export const functionFromPath = (path: string): string => {
	// check if it's indeed a path, and if so return the filename
	// TODO: check if file exists?
	if(path.endsWith(MATLAB_EXT)) {
		const parsed = parse(path);
		var fcn = parsed.name;
		const match = parsed.dir.match(PKG_REGEX);
		// If we have a package, let's add it to the name:
		if(match !== null && match.length === 2 && match[1] !== undefined) {
			// The capture starts with +, remove it by taking the substring.
			// Then, eeplace all the groups of /+ by a .
			var pkg = match[1].substring(1).replace(`${sep}+`, '.');
			// Merge package path and function name together:
			fcn = `${pkg}.${fcn}`;
		}

		return fcn;
	}
	return path;
};


//**************************************************************************
export const isMatlabFile = (source: DebugProtocol.Source): boolean => {
	if(source.path !== undefined) {
		return source.path.endsWith(MATLAB_EXT);
	}

	return source.name !== undefined && source.name.endsWith(MATLAB_EXT);
};


//**************************************************************************
export const validDirectory = (dir: string): boolean => {
	try {
		if(dir !== undefined && dir !== '' && dir !== '.') {
			fs.accessSync(dir, fs.constants.F_OK);
			return true;
		}
	} catch (err) {};
	return false;
};


//**************************************************************************
function pad(n: number, size: number, c: string = '0'): string {
	let str: string = n.toString();

	if(str.length < size) {
		const required: number = size - str.length;
		str = (c.repeat(required) + str).substr(-size);
	}

	return str;
}


//**************************************************************************
export const timestamp = (): string => {
	const now = new Date();

	const YYYY = now.getFullYear();
	const MM = pad(now.getMonth(), 2);
	const DD = pad(now.getDate(), 2);

	const hh = pad(now.getHours(), 2);
	const mm = pad(now.getMinutes(), 2);
	const ss = pad(now.getSeconds(), 2);

	return `${YYYY}${MM}${DD}_${hh}${mm}${ss}`;
}
