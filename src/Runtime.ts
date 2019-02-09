import { OctaveLogger } from './Utils/OctaveLogger';
import { spawn, ChildProcess } from 'child_process';
import { ReadLine, createInterface } from "readline";
import { EventEmitter } from 'events';
import * as Constants from './Constants';
import { functionFromPath } from './Utils/misc';
import { dirname } from 'path';



export class Runtime extends EventEmitter {
	//**************************************************************************
	public static readonly PROMPT = 'debug> ';
	public static readonly PROMPT_REGEX = new RegExp(`^(?:${Runtime.PROMPT})*`);
	//**************************************************************************
	private static readonly SYNC = `vsc::${Constants.MODULE_NAME}`;
	private static readonly SYNC_REGEX = new RegExp(`^(?:${Runtime.PROMPT})*\s*${Runtime.SYNC}`);
	//**************************************************************************
	private static readonly TERMINATOR = `end::${Runtime.SYNC}`;
	private static readonly TERMINATOR_REGEX = new RegExp(`^(?:${Runtime.PROMPT})*${Runtime.TERMINATOR}$`);


	//**************************************************************************
	private _commandNumber = 0;
	private _processName: string;
	private _process: ChildProcess;
	private _processStdout: ReadLine;
	private _processStderr: ReadLine;
	private _inputHandler: Array<(str: string) => boolean>;
	private _stderrHandler: Array<(str: string) => boolean>;
	private _stdoutBuffer: string = '';
	private _stdoutHandled: boolean;
	private _program: string;


	//**************************************************************************
	public constructor(
		processName: string,
		sourceFolder: string
	)
	{
		super();
		this._processName = processName;

		this.clearInputHandlers();
		this.clearEventHandlers();

		this.connect();

		if(this.connected()) {
			this.send('debug_on_error;debug_on_warning;debug_on_interrupt;');
			this.addFolder(sourceFolder);
		}
	}


	//**************************************************************************
	public addFolder(sourceFolder: string): void {
		// This allows us to run code from anywhere on our HD.
		if(sourceFolder.length !== 0) {
			this.send(`addpath('${sourceFolder}')`);
		}
	}


	//**************************************************************************
	private connect() {
		OctaveLogger.debug(`Runtime: connecting to '${this._processName}'.`);
		this._process = spawn(this._processName);

		if(this.connected()) {
			this._processStdout = createInterface({ input: this._process.stdout, terminal: false });
			this._processStderr = createInterface({ input: this._process.stderr, terminal: false });
			this._process.on('close', code => { this.onExit(code); });
			this._process.on('error', err => { this.onError(err); });
			this._processStdout.on('line', data => { this.onStdout(data); });
			this._processStderr.on('line', data => { this.onStderr(data); });
		}
	}


	//**************************************************************************
	public connected(): boolean {
		return this._process.pid !== undefined;
	}


	//**************************************************************************
	public disconnect() {
		OctaveLogger.debug("Killing Runtime.");
		this._process.kill('SIGKILL');
	}


	//**************************************************************************
	// Public interface
	//**************************************************************************
	public addInputHandler(callback: (str: string) => boolean) {
		this._inputHandler.push(callback);
	}


	//**************************************************************************
	public addStderrHandler(callback: (str: string) => boolean) {
		this._stderrHandler.push(callback);
	}


	//**************************************************************************
	public clearInputHandlers() {
		this._inputHandler = new Array<(str: string) => boolean>();
	}


	//**************************************************************************
	public clearEventHandlers() {
		this._stderrHandler = new Array<(str: string) => boolean>();
	}


	//**************************************************************************
	public send(cmd: string) {
		++this._commandNumber;
		OctaveLogger.info(`${this._processName}:${this._commandNumber}> ${cmd}`);
		this._process.stdin.write(`${cmd}\n`); // \n here is like pressing enter
	}


	//**************************************************************************
	public static syncString(id: number): string {
		return `${Runtime.SYNC}:${id}`;
	}


	//**************************************************************************
	public static syncRegEx(id: number): RegExp {
		return new RegExp(`^(?:${Runtime.PROMPT})*${Runtime.syncString(id)}$`);
	}


	//**************************************************************************
	public sync(): number {
		const id = this._commandNumber;
		// The \\n here separates the sync from other matlab commands.
		this.send(this.echo(`\\n${Runtime.syncString(id)}`));
		return id;
	}


	//**************************************************************************
	public waitSync(callback: (str: string) => void): void {
		let syncRegex;
		this.addInputHandler((str: string) => {
			if(str.match(syncRegex) !== null) {
				// return everything we caught so far, except the sync tag.
				callback(this._stdoutBuffer.length !== 0? this._stdoutBuffer : '');
				return true;
			}
			return false;
		});
		syncRegex = Runtime.syncRegEx(this.sync());
	}


	//**************************************************************************
	public waitSend(cmd: string, callback: (str: string) => void): void {
		this.send(cmd);
		this.waitSync(callback);
	}


	//**************************************************************************
	public evaluate(expression: string, callback: (value: string) => void) {
		let value = '';
		let syncRegex;

		this._inputHandler.push((str: string) => {
			if(str.match(syncRegex) !== null) {
				callback(value);
				return true;
			} else {
				str = Runtime.clean(str);

				if(str.length !== 0) {
					if(value.length !== 0) {
						value += '\n';
					}

					value += str;
				}
			}

			return false;
		});

		this.send(expression);
		syncRegex = Runtime.syncRegEx(this.sync());
	}


	//**************************************************************************
	// Execution control
	//**************************************************************************
	public start(program: string) {
		this._program = program;
		this.addFolder(dirname(program));
		// The \\n separates the terminator from any earlier command.
		// This is just like a deferred sync command.
		const terminator = this.echo(`\\n${Runtime.TERMINATOR}`);
		this.send(`${functionFromPath(program)};${terminator}`);
	}


	//**************************************************************************
	// Private interface
	//**************************************************************************
	private onStdout(data) {
		if(!this.terminated(data)) {
			const callback = this._inputHandler.shift();

			if(callback !== undefined && !callback(data)) {
				this.flushStdout();
				// Not fully handled, still gathering input.
				this._inputHandler.unshift(callback);
				this._stdoutHandled = true;
				this._stdoutBuffer += Runtime.clean(data) + '\n';
			} else if(this._stdoutHandled || data.match(Runtime.SYNC_REGEX)) {
				data = Runtime.clean(data) + '\n';
				// Complete input gathered, so output/log it.
				// It's a debugger command output it via debug.
				OctaveLogger.info(this._stdoutBuffer + data);
				this._stdoutHandled = false;
				this._stdoutBuffer = '';
			} else {
				this._stdoutBuffer += data + '\n';
			}
		}
	}


	//**************************************************************************
	private flushStdout() {
		if(!this._stdoutHandled && this._stdoutBuffer.length !== 0) {
			OctaveLogger.warn(this._stdoutBuffer); // Program output is routed via warn.
			this._stdoutHandled = false;
			this._stdoutBuffer = '';
		}
	}


	//**************************************************************************
	private onStderr(data) {
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
	private onExit(code) {
		OctaveLogger.debug(`Runtime: ${this._processName} exited with code: ${code}`);
		this.emit('exit');
	}


	//**************************************************************************
	private onError(msg) {
		if(!this._process.connected) {
			msg += `\nCould not connect to '${this._processName}'.`;
		}

		if(this._process.killed) {
			msg += `\nProcess '${this._processName}' was killed.`;
		}

		OctaveLogger.debug(msg);
		this.emit('error');
	}


	//**************************************************************************
	private echo(str: string): string {
		return `printf("${str}\\n");`;
	}


	//**************************************************************************
	private terminated(data: string): boolean {
		if(data.match(Runtime.TERMINATOR_REGEX) !== null) {
			this.flushStdout();
			OctaveLogger.debug(`Runtime: program ${this._program} exited normally.`);
			this.emit('end');
			return true;
		}

		return false;
	}


	//**************************************************************************
	public static clean(str: string): string {
		return str.replace(Runtime.PROMPT_REGEX, '').trim();
	}
}
