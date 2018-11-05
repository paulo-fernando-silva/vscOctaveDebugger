//******************************************************************************
import { DebugProtocol } from 'vscode-debugprotocol';
import { Breakpoint } from 'vscode-debugadapter';
import { Runtime } from '../Runtime';
import { functionFromPath } from '../Utils/misc';

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
		let syncRegex;
		runtime.addInputHandler((str: string) => {
			if(str.match(syncRegex) !== null) {
				callback(confirmedBreakpoints);
				return true;
			}

			const match = str.match(/^(?:ans =)?\s*((?:\d+\s*)+)$/);
			if(match !== null && match.length === 2) {
				const lines = match[1].split(' ').filter((val) => val);
				const octaveBreakpoints = lines.map(l => this.toBreakpoint(l));
				octaveBreakpoints.forEach(b => confirmedBreakpoints.push(b));
			}

			return false;
		});

		const fname = functionFromPath(path);
		let lines = '';
		breakpoints.forEach(b => {
			if(b.condition !== undefined && b.condition.length !== 0) {
				runtime.send(`dbstop in ${fname} at ${b.line} if ${b.condition}`);
			} else {
				lines += `${b.line} `;
			}
		});
		runtime.send(`dbstop ${fname} ${lines}`);
		syncRegex = Runtime.syncRegEx(runtime.sync());
	}


	//**************************************************************************
	public static clearAllBreakpointsIn(path: string,
										runtime: Runtime,
										callback: () => void): void
	{
		Breakpoints.listBreakpointsIn(path, runtime, (lines: string) => {
			Breakpoints.clearBreakpoints(path, lines, runtime);
			callback();
		});
	}


	//**************************************************************************
	public static clearBreakpoints(	path: string,
									lines: string,
									runtime: Runtime): void
	{
		const func = functionFromPath(path);
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


	//**************************************************************************
	// e.g.
	// debug> dbstatus TestOctaveDebugger
	// breakpoints in TestOctaveDebugger at lines 23 27
	// breakpoint in TestOctaveDebugger>testNestedFunctionLevel2 at line 37
	public static listBreakpointsIn(path: string,
									runtime: Runtime,
									callback: (lines: string) => void): void
	{
		const fname = functionFromPath(path);
		const breakpointRegEx =
		new RegExp(`^(?:${Runtime.PROMPT})*breakpoint[s]? in ${fname}(?:>\\w+)*? at line[s]? ((?:\\d+ )+)$`);
		let lines = '';
		let syncRegEx;

		runtime.addInputHandler((str: string) => {
			if(str.match(syncRegEx) !== null) {
				callback(lines.trim());
				return true;
			}

			const match = str.match(breakpointRegEx);
			if(match !== null && match.length === 2) {
				lines += match[1];
			}

			return false;
		});

		runtime.send(`dbstatus ${fname}`);
		syncRegEx = Runtime.syncRegEx(runtime.sync());
	}
}
