import { Logger, logger } from 'vscode-debugadapter';


//******************************************************************************
export class OctaveLogger {
	public static logToConsole: boolean = false;
	public static outputEnabled: boolean = true;


	//**************************************************************************
	private static shouldOutput(str: string): boolean {
		return OctaveLogger.outputEnabled && str.trim().length !== 0;
	}


	//**************************************************************************
	public static setup(verbose: boolean | undefined): void {
		const logLevel = (verbose? Logger.LogLevel.Verbose : Logger.LogLevel.Log);
		OctaveLogger.outputEnabled = true;
		logger.setup(logLevel, false);
	}


	//**************************************************************************
	public static verbose(str: string): void {
		if(this.shouldOutput(str)) {
			if(OctaveLogger.logToConsole) {
				console.log(str);
			}
			logger.verbose(str);
		}
	}


	//**************************************************************************
	public static log(str: string): void {
		if(this.shouldOutput(str)) {
			if(OctaveLogger.logToConsole) {
				console.log(str);
			}
			logger.log(str);
		}
	}


	//**************************************************************************
	public static warn(str: string): void {
		if(this.shouldOutput(str)) {
			if(OctaveLogger.logToConsole) {
				console.warn(str);
			}
			logger.warn(str);
		}
	}


	//**************************************************************************
	public static error(str: string): void {
		if(this.shouldOutput(str)) {
			if(OctaveLogger.logToConsole) {
				console.error(str);
			}
			logger.error(str);
		}
	}


	//**************************************************************************
	// aliases used to differentiate certain types of communication
	//**************************************************************************
	public static debug(str: string): void {
		OctaveLogger.verbose(str);
	}
}
