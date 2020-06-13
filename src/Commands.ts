import { validDirectory } from './Utils/fsutils';


export interface CommandInterface {
	//**************************************************************************
	evaluateAsLine(expression: string, callback: (line: string) => void): void;

	//**************************************************************************
	evaluate(expression: string, callback: (lines: string[]) => void): void;

	//**************************************************************************
	execute(expression: string):void;
}


// Implements common runtime commands, so they can be used with CommandInterface:
export class Commands {
	//**************************************************************************
	public static addFolder(ci: CommandInterface, sourceFolder: string): void {
		// We can pass multiple directories here separated by :
		// This allows us to run code from anywhere on our HD.
		ci.execute(`addpath('${sourceFolder}')`);
	}


	//**************************************************************************
	public static cwd(ci: CommandInterface, newWorkingDirectory: string): void {
		if(validDirectory(newWorkingDirectory)) {
			ci.execute(`cd '${newWorkingDirectory}'`);
		}
	}


	//**************************************************************************
	private static readonly CLEAN_REGEX = /^\s*ans =\s*/;
	public static getValue(str: string): string {
		return str.replace(Commands.CLEAN_REGEX, '').trim();
	}


	//**************************************************************************
	public static pwd(ci: CommandInterface, callback: (workingDirectory: string) => void): void {
		ci.evaluateAsLine('pwd', (line: string) => {
			callback(Commands.getValue(line));
		});
	}


	//**************************************************************************
	// Executes callback in dir, and goes back to old working directory at the end.
	// Calling function is responsible for calling the popd when needed.
	public static pushd(
		ci: CommandInterface,
		dir: string,
		callback: (ci: CommandInterface, popd: (ci: CommandInterface) => void) => void
	): void
	{
		Commands.pwd(ci, (oldWorkingDirectory: string) => {
			Commands.cwd(ci, dir);
			callback(ci, (ci: CommandInterface) => {
				Commands.cwd(ci, oldWorkingDirectory);
			});
		});
	}
}