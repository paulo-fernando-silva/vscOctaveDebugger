import { Logger, logger } from 'vscode-debugadapter';


//******************************************************************************
export class OctaveLogger {
	public static logToConsole: boolean = false;


	//**************************************************************************
	public static setup(trace: boolean): void {
		logger.setup(trace ? Logger.LogLevel.Log : Logger.LogLevel.Warn, false);
	}


	//**************************************************************************
	public static log(str: string): void {
		if(OctaveLogger.logToConsole) {
			console.log(str);
		}
		logger.log(str);
	}


	//**************************************************************************
	public static warn(str: string): void {
		if(OctaveLogger.logToConsole) {
			console.warn(str);
		}
		logger.warn(str);
	}


	//**************************************************************************
	public static verbose(str: string): void {
		if(OctaveLogger.logToConsole) {
			console.log(str);
		}
		logger.verbose(str);
	}


	//**************************************************************************
	// aliases used to differentiate certain types of communication
	//**************************************************************************
	public static info(str: string): void {
		OctaveLogger.verbose(str);
	}


	//**************************************************************************
	public static debug(str: string): void {
		OctaveLogger.log(str);
	}
}
