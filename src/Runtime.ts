import { OctaveLogger } from './OctaveLogger';
import { spawn, ChildProcess } from 'child_process';
import { ReadLine, createInterface } from 'readline';
import { EventEmitter } from 'events';
import * as Constants from './Constants';
import { functionFromPath, validDirectory } from './Utils/fsutils';
import { dirname } from 'path';


export class Runtime extends EventEmitter {
	//**************************************************************************
	//#region private
	//**************************************************************************
	public static readonly DBG_PROMPT = 'debug> ';
	//**************************************************************************
	private static readonly SYNC = `vsc::${Constants.MODULE_NAME}:`;
	private static readonly SYNC_BEGIN = `begin::${Runtime.SYNC}`;
	private static readonly SYNC_END = `end::${Runtime.SYNC}`;
	private static readonly SYNC_BEGIN_REGEX = new RegExp(`${Runtime.SYNC_BEGIN}(\\d+)`);
	private static readonly SYNC_END_REGEX = new RegExp(`${Runtime.SYNC_END}(\\d+)`);
	private static readonly SYNC_REGEX = new RegExp(`::${Runtime.SYNC}(\\d+)`);
	//**************************************************************************
	private static readonly TERMINATOR = `end::${Runtime.SYNC}`;
	private static readonly TERMINATOR_REGEX = new RegExp(`^${Runtime.TERMINATOR}$`);
	//**************************************************************************
	private static readonly NOT_CONSUMING = 0x00000000;
	private static readonly BEGUN_CONSUMING = 0x00000001;
	private static readonly ENDED_CONSUMING = 0x00000002;


	//**************************************************************************
	private _inputHandler = new Array<(str: string) => number>();
	private _stderrHandler = new Array<(str: string) => boolean>();
	private _commandNumber = 0;
	private _processName: string;
	private _process: ChildProcess;
	private _processStdout: ReadLine;
	private _processStderr: ReadLine;
	private _program: string;
	private _autoTerminate: boolean;


	//**************************************************************************
	private static split(str: string): Array<string> {
		return str.split(this.DBG_PROMPT).filter((val) => val);
	}


	//**************************************************************************
	private connect() {
		OctaveLogger.debug(`Runtime: connecting to '${this._processName}'.`);
		this._process = spawn(this._processName);

		if(this.connected()) {
			this._processStdout = createInterface(
				{ input: this._process.stdout, terminal: false, crlfDelay: Infinity });
			this._processStderr = createInterface(
				{ input: this._process.stderr, terminal: false, crlfDelay: Infinity });
			this._process.on('close', code => { this.onExit(code); });
			this._process.on('error', err => { this.onError(err); });
			this._processStdout.on('line', data => { this.onStdout(data); });
			this._processStderr.on('line', data => { this.onStderr(data); });
		}
	}


	//**************************************************************************
	private isConsumed(data: string): boolean {
		let consumeCallbackResult = Runtime.NOT_CONSUMING;

		while(this._inputHandler.length !== 0) {
			consumeCallbackResult = this._inputHandler[0](data);

			if(consumeCallbackResult === Runtime.ENDED_CONSUMING) {
				this._inputHandler.shift(); // Done consuming input, remove handler.
			} else {
				break; // This handler requires more input so we exit now.
			}
		}

		return consumeCallbackResult !== Runtime.NOT_CONSUMING;
	}


	//**************************************************************************
	private isSync(data: string): boolean {
		const match = data.match(Runtime.SYNC_REGEX);
		return match !== null && match.length > 1;
	}


	//**************************************************************************
	private onStdout(data: string) {
		const lines = Runtime.split(data);

		lines.forEach(line => {
			if(	!this.terminated(line) &&
				!this.isConsumed(line) &&
				!this.isSync(line))
			{
				// User data, output immediately.
				OctaveLogger.log(line);
			}
		});
	}


	//**************************************************************************
	private onStderr(data: string) {
		this._stderrHandler.some(callback => {
			return callback(data);
		});

		if(data.startsWith(Constants.ERROR_EXP)) {
			OctaveLogger.error(data);
		} else {
			OctaveLogger.warn(data);
		}
	}


	//**************************************************************************
	private onExit(code: number) {
		const msg = `Runtime: ${this._processName} exited with code: ${code}`;

		if(code !== 0) {
			OctaveLogger.debug(msg);
		} else {
			OctaveLogger.error(msg);
		}

		this.emit(Constants.eEXIT);
	}


	//**************************************************************************
	private onError(err: Error) {
		let msg = err.toString();

		if(!this._process.connected) {
			msg += `\nCould not connect to '${this._processName}'.`;
			this.emit(Constants.eEXIT);
		}

		if(this._process.killed) {
			msg += `\nProcess '${this._processName}' was killed.`;
			this.emit(Constants.eEXIT);
		}

		OctaveLogger.debug(msg);

		if(this.autoTerminate()) {
			this.emit(Constants.eERROR);
		}
	}


	//**************************************************************************
	private echo(str: string): string {
		// The ' ' space at the beginning unpauses octave when stepping.
		// TODO: this shouldn't be needed. User should be able to used pause, etc...
		// The \\n put this output in a new line
		return ` printf("\\n${str}\\n");`;
	}


	//**************************************************************************
	private terminated(data: string): boolean {
		if(this.autoTerminate() && data.match(Runtime.TERMINATOR_REGEX) !== null) {
			OctaveLogger.debug(`Runtime: program ${this._program} exited normally.`);
			this.emit(Constants.eEND);
			return true;
		}

		return false;
	}

	//**************************************************************************
	//#endregion
	//**************************************************************************

	//**************************************************************************
	//#region public
	//**************************************************************************
	public constructor(
		processName: string,
		sourceFolder: string,
		autoTerminate = true
	)
	{
		super();
		this._processName = processName;
		this._autoTerminate = autoTerminate;

		this.connect();

		if(this.connected()) {
			// this.execute('debug_on_error;debug_on_warning;debug_on_interrupt;');
			this.addFolder(sourceFolder);
		}
	}


	//**************************************************************************
	public addFolder(sourceFolder: string): void {
		// We can pass multiple directories here separated by :
		// This allows us to run code from anywhere on our HD.
		this.execute(`addpath('${sourceFolder}')`);
	}


	//**************************************************************************
	public cwd(newWorkingDirectory: string): void {
		if(validDirectory(newWorkingDirectory)) {
			this.execute(`cd '${newWorkingDirectory}'`);
		}
	}


	//**************************************************************************
	public connected(): boolean {
		return this._process.pid !== undefined;
	}


	//**************************************************************************
	public disconnect() {
		OctaveLogger.debug("Killing Runtime.");
		this.execute('quit');
		this._process.kill('SIGKILL');
	}


	//**************************************************************************
	public pause() {
		OctaveLogger.debug("Pausing Runtime.");
		this._process.kill('SIGINT');
	}


	//**************************************************************************
	public start(program: string, workingDirectory: string) {
		this._program = program;
		this.addFolder(dirname(program));
		this.cwd(workingDirectory);

		// This is just like a deferred sync command.
		// The program executes and then echoes the terminator tag.
		const terminator = this.echo(Runtime.TERMINATOR);
		this.execute(`${functionFromPath(program)};${terminator}`);
	}


	//**************************************************************************
	public addStderrHandler(callback: (str: string) => boolean) {
		this._stderrHandler.push(callback);
	}


	//**************************************************************************
	public evaluateAsLine(expression: string, callback: (line: string) => void) {
		this.evaluate(expression, (output: string[]) => {
			callback(output.join('\n'));
		});
	}


	//**************************************************************************
	// Sends the expression through for evaluation,
	// and gathers all output until the command number shows up in the output.
	public evaluate(expression: string, callback: (lines: string[]) => void) {
		let commandNumber: number = this._commandNumber; // cache the current command #
		let lines: string[] = [];
		let status = Runtime.NOT_CONSUMING;
		let regex = Runtime.SYNC_BEGIN_REGEX;

		this._inputHandler.push((line: string) => {
			const match = line.match(regex);
			// pause, input, etc... can consume sync commands
			// so we need to consider any sync match >= the original one
			if(match !== null && match.length > 1 && parseInt(match[1]) >= commandNumber) {
				regex = Runtime.SYNC_END_REGEX;
				++status;
				// If we hit the end sync we skip this line on the output
				if(status === Runtime.ENDED_CONSUMING) {
					callback(lines);
					OctaveLogger.debug(lines.join('\n'));
				}
			} else if(status === Runtime.BEGUN_CONSUMING) {
				lines.push(line);
			}

			return status;
		});

		const syncBeginCmd = this.echo(`${Runtime.SYNC_BEGIN}${commandNumber}`);
		const syncEndCmd = this.echo(`${Runtime.SYNC_END}${commandNumber}`);
		// The 1st & 3rd cmds don't need \n, as it's included in the echo.
		// The user expression needs it as it might not have ;
		this.execute(`${syncBeginCmd}${expression}\n${syncEndCmd}`);
	}


	//**************************************************************************
	// All communication with the process goes through here.
	public execute(expression: string) {
		// And also log them out to the console
		OctaveLogger.debug(`${this._processName}:${this._commandNumber}> ${expression}`);
		// This actually sends the command to octave, \n is like pressing enter.
		this._process.stdin.write(`${expression}\n`);
		// We keep track of the commands sent through
		++this._commandNumber;
	}


	//**************************************************************************
	public autoTerminate(): boolean {
		return this._autoTerminate;
	}


	//**************************************************************************
	//#endregion
	//**************************************************************************
}
