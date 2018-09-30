import { spawn, ChildProcess } from 'child_process';
import { ReadLine, createInterface } from "readline";
import { EventEmitter } from 'events';
import * as Constants from './Constants';
import { functionFromPath } from './Utils';


export class Runtime extends EventEmitter {
	//**************************************************************************
	public static readonly PROMPT = 'debug> ';
	//**************************************************************************
	private static readonly PROMPT_REGEX = new RegExp(`^(?:${Runtime.PROMPT})*`);
	private static readonly SYNC = `vsc::${Constants.MODULE_NAME}`;
	private static readonly TERMINATOR = `end::${Runtime.SYNC}`;
	private static readonly TERMINATOR_REGEX = new RegExp(`^(?:${Runtime.PROMPT})*${Runtime.TERMINATOR}$`);


	//**************************************************************************
	private _commandNumber = 0;
	private _processName: string;
	private _process: ChildProcess;
	private _processStdout: ReadLine;
	private _processStderr: ReadLine;
	private _inputHandler: Array<(str: string) => boolean>;
	private _eventHandler: Array<(str: string) => boolean>;
	private _log: boolean = true;


	//**************************************************************************
	public constructor(
		processName: string,
		sourceFolder: string,
		log: boolean = true)
	{
		super();
		this._processName = processName;
		this.setLog(log);
		this.connect();
		this.clearInputHandlers();
		this.clearEventHandlers();

		// This allows us to run code from anywhere on our HD.
		this.send(`addpath('${sourceFolder}')`);
		this.sync();
	}


	//**************************************************************************
	public setLog(log: boolean): void {
		this._log = log;
	}


	//**************************************************************************
	public getLog(): boolean {
		return this._log;
	}


	//**************************************************************************
	private connect() {
		this._process = spawn(this._processName);

		this._processStdout = createInterface({ input: this._process.stdout, terminal: false });
		this._processStderr = createInterface({ input: this._process.stderr, terminal: false });

		this._process.on('close', code => { this.onExit(code); });
		this._processStdout.on('line', data => { this.onStdout(data); });
		this._processStderr.on('line', data => { this.onStderr(data); });
	}


	//**************************************************************************
	public disconnect() {
		this.send('quit');
	}


	//**************************************************************************
	// Public interface
	//**************************************************************************
	public addInputHandler(callback: (str: string) => boolean) {
		this._inputHandler.push(callback);
	}


	//**************************************************************************
	public addEventHandler(callback: (str: string) => boolean) {
		this._eventHandler.push(callback);
	}


	//**************************************************************************
	public clearInputHandlers() {
		this._inputHandler = new Array<(str: string) => boolean>();
	}


	//**************************************************************************
	public clearEventHandlers() {
		this._eventHandler = new Array<(str: string) => boolean>();
	}


	//**************************************************************************
	public send(cmd: string) {
		++this._commandNumber;
		this.log(`${this._processName}:${this._commandNumber}> ${cmd}`);
		this._process.stdin.write(`${cmd}\n`);
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
		this.send(this.echo(Runtime.syncString(id)));
		return id;
	}


	//**************************************************************************
	public waitSync(callback: () => void): void {
		let syncRegex;
		this.addInputHandler((str: string) => {
			if(str.match(syncRegex) !== null) {
				callback();
				return true;
			}
			return false;
		});
		syncRegex = Runtime.syncRegEx(this.sync());
	}


	//**************************************************************************
	public waitSend(cmd: string, callback: () => void): void {
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
				str = str.replace(Runtime.PROMPT_REGEX, '').trim();

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
	public start(	program: string,
					stopOnEntry: boolean) // TODO: support
	{
		this.send(functionFromPath(program) + ';' + this.echo(Runtime.TERMINATOR));
	}


	//**************************************************************************
	// Private interface
	//**************************************************************************
	private onStdout(data) {
		this.log(`stdout> ${data}`);

		if(!this.terminated(data)) {
			const callback = this._inputHandler.shift();

			if(callback !== undefined && !callback(data.toString())) {
				this._inputHandler.unshift(callback);
			}
		}
	}


	//**************************************************************************
	private onStderr(data) {
		this._eventHandler.some(callback => {
			return callback(data);
		});
		this.log(`stderr> ${data}`);
	}


	//**************************************************************************
	private onExit(code) {
		this.log(`${this._processName} exited with code: ${code}`);
		this.emit('end');
	}


	//**************************************************************************
	private echo(str: string): string {
		return `printf("${str}\\n")`;
	}


	//**************************************************************************
	private terminated(data: string): boolean {
		if(data.match(Runtime.TERMINATOR_REGEX) !== null) {
			this.emit('end');
			return true;
		}

		return false;
	}


	//**************************************************************************
	private log(str: string): void {
		if(this._log) {
			console.log(str);
		}
	}
}
