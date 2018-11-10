import { basename } from 'path';
import { DebugProtocol } from 'vscode-debugprotocol';

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
