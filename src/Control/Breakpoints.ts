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
	public static set(
		breakpoints: Array<ConditionalBreakpoint>,
		path: string,
		runtime: Runtime,
		callback: (breakpoints: Array<Breakpoint>) => void
	): void
	{
		const confirmedBreakpoints = new Array<Breakpoint>();
		if(breakpoints.length !== 0) {
			const fname = functionFromPath(path);
			let lines = '';
			breakpoints.forEach(b => {
				if(b.condition !== undefined && b.condition.length !== 0) {
					// TODO: shouldn't these also be confirmed?
					runtime.execute(`dbstop in ${fname} at ${b.line} if ${b.condition}`);
				} else {
					lines += `${b.line} `;
				}
			});

			runtime.evaluate(`dbstop ${fname} ${lines}`, (line: string | null) => {
				if(line === null) {
					callback(confirmedBreakpoints);
				} else {
					const match = line.match(/^(?:ans =)?\s*((?:\d+\s*)+)$/);
					if(match !== null && match.length === 2) {
						const lines = match[1].split(' ').filter((val) => val);
						const octaveBreakpoints = lines.map(l => this.toBreakpoint(l));
						octaveBreakpoints.forEach(b => confirmedBreakpoints.push(b));
					}
				}
			});
		} else {
			callback(confirmedBreakpoints);
		}
	}


	//**************************************************************************
	public static clearAllBreakpointsIn(
		path: string,
		runtime: Runtime,
		callback: () => void
	): void
	{
		Breakpoints.listBreakpointsIn(path, runtime, (lines: string) => {
			Breakpoints.clearBreakpoints(path, lines, runtime);
			callback();
		});
	}


	//**************************************************************************
	public static clearBreakpoints(
		path: string,
		lines: string,
		runtime: Runtime
	): void
	{
		const func = functionFromPath(path);
		runtime.execute(`dbclear ${func} ${lines}`);
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
	public static listBreakpointsIn(
		path: string,
		runtime: Runtime,
		callback: (lines: string) => void
	): void
	{
		const fname = functionFromPath(path);
		const breakpointRegEx =
		new RegExp(`^(?:${Runtime.PROMPT})*breakpoint[s]? in ${fname}(?:>\\w+)*? at line[s]? ((?:\\d+ )+)$`);
		let lines = '';

		runtime.evaluate(`dbstatus ${fname}`, (line: string | null) => {
			if(line === null) {
				callback(lines.trim());
			} else {
				const match = line.match(breakpointRegEx);
				if(match !== null && match.length === 2) {
					lines += match[1];
				}
			}
		});
	}
}
