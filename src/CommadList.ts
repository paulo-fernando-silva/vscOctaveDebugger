import * as Constants from './Constants';
import { Runtime, CommandInterface } from './Runtime';


//**************************************************************************
class ExecuteCommand {
	public id: number;
	public command: string;

	public constructor(id: number, cmd: string) {
		this.id = id;
		this.command = cmd;
	}

	public callback(output: string) {}
};


//**************************************************************************
class SingleLineOutputCommand extends ExecuteCommand {
	private cb: (output: string) => void;

	public constructor(
		id: number,
		cmd: string,
		cb: (output: string) => void
	)
	{
		super(id, cmd);
		this.cb = cb;
	}

	public callback(output: string) {
		this.cb(output);
	}
};


//**************************************************************************
class MultilineOutputCommand extends ExecuteCommand {
	private cb: (output: string[]) => void;

	public constructor(
		id: number,
		cmd: string,
		cb: (output: string[]) => void
	)
	{
		super(id, cmd);
		this.cb = cb;
	}

	public callback(output: string) {
		this.cb(output.split('\n'));
	}
};


export class CommandList implements CommandInterface {
	//**************************************************************************
	//#region private
	//**************************************************************************
	private static readonly SYNC = `${Constants.MODULE_NAME}::cl`;

	//**************************************************************************
	private _recording = new Array<ExecuteCommand>();
	private _executing = new Array<ExecuteCommand>();
	private _id = 0;


	//**************************************************************************
	private close(): void {
		this._executing = this._recording;
		this._recording = new Array<ExecuteCommand>();
	}


	//**************************************************************************
	public process(output: string): void {
		const lines = output.split(CommandList.SYNC);
		const cl = this._executing;

		// In practice we should always have at least as many syncs as commands.
		const N = Math.min(cl.length, lines.length);

		for(let i = 0; i !== N; ++i) {
			cl[i].callback(lines[i]);
		}
	}

	//**************************************************************************
	//#endregion
	//**************************************************************************

	//**************************************************************************
	//#region public
	//**************************************************************************
	public constructor(id: number) {
		this._id = id;
	}


	//**************************************************************************
	public record(command: ExecuteCommand): void {
		command.id = this._recording.length;
		this._recording.push(command);
	}


	//**************************************************************************
	public evaluateAsLine(expression: string, callback: (line: string) => void) {
		this.record(new SingleLineOutputCommand(0, expression, callback));
	}


	//**************************************************************************
	public evaluate(expression: string, callback: (lines: string[]) => void) {
		this.record(new MultilineOutputCommand(0, expression, callback));
	}


	//**************************************************************************
	public execute(expression: string) {
		this.record(new ExecuteCommand(0, expression));
	}


	//**************************************************************************
	public executeCommandList(runtime: Runtime, callback: (cl: CommandList) => void) {
		this.close();

		const cmds = this.commands();

		runtime.evaluateAsLine(cmds, (output: string) => {
			this.process(output);
			callback(this);
		});
	}


	//**************************************************************************
	public commands(): string {
		let cmds = '';

		this._executing.forEach(cmd =>
			cmds += `${cmd.command}\n${Runtime.echo(CommandList.SYNC)}`
		);

		return cmds;
	}


	//**************************************************************************
	public empty(): boolean {
		return this._recording.length === 0;
	}


	//**************************************************************************
	public id(): number {
		return this._id;
	}

	//**************************************************************************
	//#endregion
	//**************************************************************************
}
