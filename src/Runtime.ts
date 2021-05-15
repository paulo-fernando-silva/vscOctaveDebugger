import { OctaveLogger } from './OctaveLogger';
import { spawn, ChildProcess } from 'child_process';
import { ReadLine, createInterface } from 'readline';
import { EventEmitter } from 'events';
import * as Constants from './Constants';
import { functionFromPath } from './Utils/fsutils';
import { dirname } from 'path';
import { Commands, CommandInterface } from './Commands';


//**************************************************************************
enum Status {
	NOT_CONSUMING = 0x00000000,
	BEGUN_CONSUMING = 0x00000001,
	ENDED_CONSUMING = 0x00000002
};

//**************************************************************************
enum MatchIndex {
	FULL_MATCH,
	STATUS,
	CMD_NUMBER,
	LENGTH
};


export class Runtime extends EventEmitter implements CommandInterface {
	//**************************************************************************
	//#region private
	//**************************************************************************
	private static readonly DBG_PROMPT = 'debug> ';
	private static readonly SEP = '::';
	private static readonly SYNC = Constants.MODULE_NAME;
	private static readonly SYNC_REGEX =
		new RegExp(`${Runtime.SYNC}${Runtime.SEP}(\\d+)${Runtime.SEP}(\\d+)`);
	private static readonly TERMINATOR = `${Runtime.SYNC}${Runtime.SEP}end`;
	private static readonly TERMINATOR_REGEX = new RegExp(Runtime.TERMINATOR);

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
	private _arguments: string[];
	private _environment: any;
	private _shell: boolean;

	//**************************************************************************
	private static createCommand(expression: string, command: number): string {
		const vars = new Array<string>(MatchIndex.LENGTH);
		// This sequence needs to match the Runtime.SYNC_REGEX pattern above.
		vars[MatchIndex.CMD_NUMBER] = `${Runtime.SEP}${command}`;
		vars[MatchIndex.STATUS] = `${Runtime.SEP}${Status.BEGUN_CONSUMING}`;
		const syncBeginCmd = Runtime.echo(`${Runtime.SYNC}${vars.join('')}`);
		vars[MatchIndex.STATUS] = `${Runtime.SEP}${Status.ENDED_CONSUMING}`;
		const syncEndCmd = Runtime.echo(`${Runtime.SYNC}${vars.join('')}`);

		return `${syncBeginCmd}${expression}\n${syncEndCmd}`;
	}


	//**************************************************************************
	private static split(str: string): Array<string> {
		return str.split(this.DBG_PROMPT).filter((val) => val);
	}


	//**************************************************************************
	private connect() {
		OctaveLogger.debug(`Runtime: connecting to '${this._processName}'.`);

		let options = {
			env : Object.assign(process.env, this._environment),
			shell: this._shell
		};
		this._process = spawn(this._processName, this._arguments, options);

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
		let consumeCallbackResult = Status.NOT_CONSUMING;

		while(this._inputHandler.length !== 0) {
			consumeCallbackResult = this._inputHandler[0](data);

			if(consumeCallbackResult === Status.ENDED_CONSUMING) {
				this._inputHandler.shift(); // Done consuming input, remove handler.
			} else {
				break; // This handler requires more input so we exit now.
			}
		}

		return consumeCallbackResult !== Status.NOT_CONSUMING;
	}


	//**************************************************************************
	private isSync(data: string): boolean {
		const match = data.match(Runtime.SYNC_REGEX);
		return match !== null;
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

		if(code !== 0 && code != null) {
			OctaveLogger.error(msg); // exited with non-zero code.
		} else {
			OctaveLogger.debug(msg);
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
		processArguments: string[],
		processEnvironment: any,
		sourceFolder: string,
		autoTerminate: boolean,
		shell: boolean
	)
	{
		super();
		this._processName = processName;
		this._autoTerminate = autoTerminate;
		this._arguments = processArguments;
		this._environment = processEnvironment;
		this._shell = shell;

		this.connect();

		if(this.connected()) {
			// this.execute('debug_on_error;debug_on_warning;debug_on_interrupt;');
			Commands.addFolder(this, sourceFolder);
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
		Commands.addFolder(this, dirname(program));
		Commands.cwd(this, workingDirectory);

		// This is just like a deferred sync command.
		// The program executes and then echoes the terminator tag.
		const terminator = Runtime.echo(Runtime.TERMINATOR);
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
		let status = Status.NOT_CONSUMING;
		// const prefix = `cmd:${commandNumber}> '${expression}'`; // DEBUG

		this._inputHandler.push((line: string) => {
			// OctaveLogger.debug(`${prefix} output: ${line}`); // DEBUG
			const match = line.match(Runtime.SYNC_REGEX);
			// pause, input, errors, etc... can consume sync commands
			if(match !== null && match.length === MatchIndex.LENGTH) {
				const cmdNum = parseInt(match[MatchIndex.CMD_NUMBER]);
				// check if sync cmd# >= the current cmd#
				if(cmdNum > commandNumber) {
					return Status.ENDED_CONSUMING;
				} else if(cmdNum < commandNumber) {
					return Status.NOT_CONSUMING;
				}
				// cmdNum === commandNumber so update status
				status = parseInt(match[MatchIndex.STATUS]);
				// If we hit the end sync we skip this line on the output
				if(status === Status.ENDED_CONSUMING) {
					callback(lines);
					OctaveLogger.debug(lines.join('\n'));
				}
			} else if(status === Status.BEGUN_CONSUMING) {
				lines.push(line);
			}

			return status;
		});

		// The 1st & 3rd cmds don't need \n, as it's included in the echo.
		// The user expression needs it as it might not have ;
		this.execute(Runtime.createCommand(expression, commandNumber));
	}


	//**************************************************************************
	// All communication with the process goes through here.
	public execute(expression: string) {
		// And also log them out to the console
		OctaveLogger.debug(`${this._processName}:${this._commandNumber}> ${expression}`);
		// This actually sends the command to Octave, \n is like pressing enter.
		this._process.stdin.write(`${expression}\n`);
		// We keep track of the commands sent through
		++this._commandNumber;
	}


	//**************************************************************************
	public autoTerminate(): boolean {
		return this._autoTerminate;
	}


	//**************************************************************************
	public static echo(str: string): string {
		// The ' ' space at the beginning unpauses Octave when stepping.
		// TODO: this shouldn't be needed. User should be able to used pause, etc...
		// The \\n put this output in a new line
		return ` printf("\\n${str}\\n");`;
	}

	//**************************************************************************
	//#endregion
	//**************************************************************************
}
