import { basename } from 'path';

const MATLAB_EXT = '.m';

//**************************************************************************
export const functionFromPath = (path: string): string => {
	return basename(path, MATLAB_EXT);
};

//**************************************************************************
export const isMatlabFile = (path: string | undefined): boolean => {
	return path !== undefined && path.endsWith(MATLAB_EXT);
};
