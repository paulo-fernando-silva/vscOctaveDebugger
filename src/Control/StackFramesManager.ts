import { OctaveLogger } from '../Utils/OctaveLogger';
import { StackFrame, Source } from 'vscode-debugadapter';
import { Runtime } from '../Runtime';


export class StackFramesManager {
	private _frame: number = 0;


	//**************************************************************************
	public constructor() {}


	//**************************************************************************
	public clear(): void {
		this._frame = 0;
	}


	//**************************************************************************
	public selectStackFrame(
		i: number,
		runtime: Runtime,
		callback: () => void
	): void
	{
		if(i === this._frame) {
			callback();
		} else if(i < this._frame) {
			this.down(this._frame - i, runtime, callback);
		} else {
			this.up(i - this._frame, runtime, callback);
		}
	}


	//**************************************************************************
	private up(
		n: number,
		runtime: Runtime,
		callback: () => void
	): void
	{
		if(n > 0) {
			runtime.execute(`dbup ${n}`, callback);
		} else {
			OctaveLogger.error(`Error: up(${n})!`);
		}
	}


	//**************************************************************************
	private down(
		n: number,
		runtime: Runtime,
		callback: () => void
	): void
	{
		if(n > 0) {
			runtime.execute(`dbdown ${n}`, callback);
		} else {
			OctaveLogger.error(`Error: down(${n})!`);
		}
	}


	//**************************************************************************
	/* Example of the expected stack output:
stopped in:

 --> TestOctaveDebugger>main3 at line 15 [/path/TestOctaveDebugger.m]
     TestOctaveDebugger>main2 at line 33 [/path/TestOctaveDebugger.m]
		   TestOctaveDebugger at line 11 [/path/TestOctaveDebugger.m]
debug>
	*/
	public get(
		startFrame: number,
		endFrame: number,
		runtime: Runtime,
		callback: (frames: Array<StackFrame>) => void
	): void
	{
		const stackframes = new Array<StackFrame>();
		runtime.evaluate('dbstack;', (line: string | null) => {
			if(line === null) {
				callback(stackframes);
			} else {
				const match = line.match(/^\s*(?:-->)?\s*(\w+)(?:>(\w+))*? at line (\d+) \[(.*)\]$/);
				if(match !== null && match.length > 1) {
					const functionName = match[match.length - 3];
					const name = (functionName !== undefined? functionName : match[1]);
					const id = stackframes.length;
					const source = new Source(name, match[match.length - 1]);
					const lineNumber = parseInt(match[match.length - 2]);
					const frame = new StackFrame(id, name, source, lineNumber);
					stackframes.push(frame);
				}
			}
		});
	}
}
