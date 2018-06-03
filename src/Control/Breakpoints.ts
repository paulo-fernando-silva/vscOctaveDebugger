//******************************************************************************
import { DebugProtocol } from 'vscode-debugprotocol';
import { Breakpoint } from 'vscode-debugadapter';
import { Runtime } from '../Runtime';
import { functionFromPath } from '../Utils';

type ConditionalBreakpoint = DebugProtocol.SourceBreakpoint;


//******************************************************************************
export class Breakpoints {
	private static _breakpointId: number = 0;


	//**************************************************************************
	public static set(	breakpoints: Array<ConditionalBreakpoint>,
						path: string,
						runtime: Runtime,
						callback: (breakpoints: Array<Breakpoint>) => void): void
	{
		const confirmedBreakpoints = new Array<Breakpoint>();
		var syncRegex;
		runtime.addInputHandler((str: string) => {
			if(str.match(syncRegex) !== null) {
				callback(confirmedBreakpoints);
				return true;
			}

			const match = str.match(/^(?:ans =)?\s*((?:\d+\s*)+)$/);
			if(match !== null && match.length == 2) {
				const lines = match[1].split(' ').filter((val) => val);
				const octaveBreakpoints = lines.map(l => this.toBreakpoint(l));
				octaveBreakpoints.forEach(b => confirmedBreakpoints.push(b));
			}

			return false;
		});

		const fname = functionFromPath(path);
		var lines = '';
		breakpoints.forEach(b => {
			if(b.condition !== undefined && b.condition.length !== 0)
				runtime.send(`dbstop in ${fname} at ${b.line} if ${b.condition}`);
			else
				lines += `${b.line} `;
		});
		runtime.send(`dbstop ${fname} ${lines}`);
		syncRegex = Runtime.syncRegEx(runtime.sync());
	}


	//**************************************************************************
	public static clearAllBreakpoints(runtime: Runtime): void {
		runtime.send('dbclear all');
		runtime.sync();
	}


	//**************************************************************************
	public static clearBreakpoints(	path: string,
									lineNumbers: Array<number>,
									runtime: Runtime): void
	{
		const func = functionFromPath(path);
		const lines = lineNumbers.join(' ');
		runtime.send(`dbclear ${func} ${lines}`);
		runtime.sync();
	}


	//**************************************************************************
	private static toBreakpoint(lineNumber: string): Breakpoint {
		return <Breakpoint>{
			verified: true,
			id: this._breakpointId++,
			line: parseInt(lineNumber)
		};
	}
}
