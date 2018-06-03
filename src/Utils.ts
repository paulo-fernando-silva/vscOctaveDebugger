import { basename } from 'path';


//**************************************************************************
export const functionFromPath = (path: string): string => {
	return basename(path, '.m');
};
