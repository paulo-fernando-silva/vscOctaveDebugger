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
	public static readonly PROMPT = 'debug> ';
	public static readonly PROMPT_REGEX = new RegExp(`^(?:${Runtime.PROMPT})*`);
	//**************************************************************************
	private static readonly SYNC = `vsc::${Constants.MODULE_NAME}:`;
	private static readonly SYNC_REGEX = new RegExp(`^(?:${Runtime.PROMPT})*\\s*${Runtime.SYNC}(\\d+)`);
	//**************************************************************************
	private static readonly TERMINATOR = `end::${Runtime.SYNC}`;
	private static readonly TERMINATOR_REGEX = new RegExp(`^(?:${Runtime.PROMPT})*${Runtime.TERMINATOR}$`);


	//**************************************************************************
	private _inputHandler = new Array<(str: string) => boolean>();
	private _stderrHandler = new Array<(str: string) => boolean>();
	private _commandNumber = 0;
	private _processName: string;
	private _process: ChildProcess;
	private _processStdout: ReadLine;
	private _processStderr: ReadLine;
	private _program: string;
	private _autoTerminate: boolean;


	//**************************************************************************
	private static clean(str: string): string {
		return str.replace(Runtime.PROMPT_REGEX, '').trim();
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
		let consumed = this._inputHandler.length !== 0;

		while(this._inputHandler.length !== 0) {
			const doneConsuming = this._inputHandler.shift();

			if(doneConsuming === undefined) {
				OctaveLogger.debug("Error: undefined input handler!");
				continue; // this should never happen
			}

			if(!doneConsuming(data)) {
				this._inputHandler.unshift(doneConsuming);
				// This handler requires more input so we exit now.
				break;
			}
		}

		return consumed;
	}


	//**************************************************************************
	private onStdout(data: string) {
		data = Runtime.clean(data);

		if(!this.terminated(data) && !this.isConsumed(data)) {
			// User data, output immediately.
			OctaveLogger.log(data);
		}
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

		this._inputHandler.push((line: string) => {
			const match = line.match(Runtime.SYNC_REGEX);
			let done = false;
			let matched = false;

			if(match !== null && match.length > 1) {
				matched = true;
				// pause, input, etc... can consume sync commands
				// so we need to consider any sync match >= the original one
				done = parseInt(match[1]) >= commandNumber;
			}

			if(done) {
				// we hit the sync so skip this line on the output
				callback(lines);
				OctaveLogger.debug(lines.join('\n'));
			} else if(matched) {
				lines = []; // just hit a sync from a previous command
			} else {
				lines.push(line);
			}

			return done;
		});

		const syncCommand = this.echo(`${Runtime.SYNC}${commandNumber}`);
		this.execute(`${expression}\n${syncCommand}`);
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
