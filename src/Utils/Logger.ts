import { logger } from 'vscode-debugadapter';


//******************************************************************************
export class Logger {
	public static logToConsole: boolean = false;


	//**************************************************************************
	public static log(str: string): void {
		if(Logger.logToConsole) {
			console.log(str);
		}
		logger.log(str);
	}


	//**************************************************************************
	public static warn(str: string): void {
		if(Logger.logToConsole) {
			console.warn(str);
		}
		logger.warn(str);
	}


	//**************************************************************************
	public static debug(str: string): void {
		Logger.log(str);
	}
}
