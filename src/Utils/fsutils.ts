import { basename } from 'path';
import { DebugProtocol } from 'vscode-debugprotocol';
import * as fs from 'fs';

const MATLAB_EXT = '.m';


//**************************************************************************
export const functionFromPath = (path: string): string => {
	return basename(path, MATLAB_EXT);
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
