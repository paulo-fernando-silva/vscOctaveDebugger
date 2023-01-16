import { OctaveLogger } from './OctaveLogger';
import { StackFrame, Source } from 'vscode-debugadapter';
import { CommandInterface } from './Commands';


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
		frame: number,
		runtime: CommandInterface,
		callback: () => void
	): void
	{
		if(frame === this._frame) {
			callback();
		} else {
			const validation = (output: string[]) => {
				this.vadidateTransition(output, frame);
				callback();
			};
			// Make sure the frame offset is positive:
			if(frame < this._frame) {
				runtime.evaluate(`dbdown ${this._frame - frame}`, validation);
			} else {
				runtime.evaluate(`dbup ${frame - this._frame}`, validation);
			}
		}
	}


	//**************************************************************************
	private static readonly TRANSITION_REGEX = /^\s*(?:stopped in.*)|(?:at top level)$/;
	/*	Expecting something like:
			'stopped in foom at line 88 [/path/file.m] '
		OR:
			'at top level'
	 */
	private vadidateTransition(output: string[], frame: number): void {
		if(output.length !== 0) {
			if(output[0].match(StackFramesManager.TRANSITION_REGEX)) {
				this._frame = frame;
			} else {
				OctaveLogger.warn(`vadidateTransition:unknown output[0] "${output[0]}"!`);
			}
		} else {
			OctaveLogger.warn(`vadidateTransition:output.length: ${output.length}!`);
		}
	}


	//**************************************************************************
	private static readonly STACK_REGEX = /^\s*(?:-->)?\s*(\w+)(?:>(\S+))*? at line (\d+) \[(.*)\]$/;
	/* Example of the expected stack output:
stopped in:

 --> TestOctaveDebugger>main3 at line 15 [/path/TestOctaveDebugger.m]
     TestOctaveDebugger>@<anonymous> at line 33 [/path/TestOctaveDebugger.m]
		   TestOctaveDebugger at line 11 [/path/TestOctaveDebugger.m]
debug>
	*/
	public get(
		startFrame: number,
		endFrame: number,
		runtime: CommandInterface,
		callback: (frames: Array<StackFrame>) => void
	): void
	{
		const stackframes = new Array<StackFrame>();
		runtime.evaluate('dbstack;', (output: string[]) => {
			output.forEach(line => {
				const match = line.match(StackFramesManager.STACK_REGEX);

				if(match !== null && match.length > 1) {
					const functionName = match[match.length - 3];
					const name = (functionName !== undefined? functionName : match[1]);
					const id = stackframes.length;
					const source = new Source(name, match[match.length - 1]);
					const lineNumber = parseInt(match[match.length - 2]);
					const frame = new StackFrame(id, name, source, lineNumber);
					stackframes.push(frame);
				}
			});

			callback(stackframes);
		});
	}
}
