//******************************************************************************
import { DebugProtocol } from 'vscode-debugprotocol';
import { Breakpoint } from 'vscode-debugadapter';
import { CommandInterface } from './Runtime';
import { functionFromPath } from './Utils/fsutils';

type ConditionalBreakpoint = DebugProtocol.SourceBreakpoint;


//******************************************************************************
export class Breakpoints {
	private static _breakpointId: number = 0;


	//**************************************************************************
	private static readonly BP_REGEX = /^\s*(?:ans =)?\s*((?:\d+\s*)+)$/;
	public static set(
		breakpoints: Array<ConditionalBreakpoint>,
		path: string,
		runtime: CommandInterface,
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

			runtime.evaluate(`dbstop ${fname} ${lines}`, (output: string[]) => {
				output.forEach(line => {
					const match = line.match(Breakpoints.BP_REGEX);

					if(match !== null && match.length === 2) {
						const lines = match[1].split(' ').filter((val) => val);
						lines.forEach(l => confirmedBreakpoints.push(this.toBreakpoint(l)));
					}
				});

				callback(confirmedBreakpoints);
			});
		} else {
			callback(confirmedBreakpoints);
		}
	}


	//**************************************************************************
	public static clearAllBreakpointsIn(
		path: string,
		runtime: CommandInterface,
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
		runtime: CommandInterface
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
		runtime: CommandInterface,
		callback: (lines: string) => void
	): void
	{
		const fname = functionFromPath(path);
		const breakpointRegEx =
			new RegExp(`^\\s*breakpoint[s]? in ${fname}(?:>\\w+)*? at line[s]? ((?:\\d+ ?)+)$`);
		let lines = '';

		runtime.evaluate(`dbstatus ${fname}`, (output: string[]) => {
			output.forEach(line => {
				const match = line.match(breakpointRegEx);

				if(match !== null && match.length === 2) {
					lines += match[1];
				}
			});

			callback(lines.trim());
		});
	}
}