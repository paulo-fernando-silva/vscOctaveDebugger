//******************************************************************************
import { DebugProtocol } from 'vscode-debugprotocol';
import { Breakpoint } from 'vscode-debugadapter';
import { Commands, CommandInterface } from './Commands';
import { functionFromPath } from './Utils/fsutils';
import { dirname } from 'path';

type ConditionalBreakpoint = DebugProtocol.SourceBreakpoint;


//******************************************************************************
export class Breakpoints {
	//**************************************************************************
	//#region private
	//**************************************************************************
	private static readonly BP_REGEX = /^\s*(?:ans =)?\s*((?:\d+\s*)+)$/;
	private static readonly BAD_BP_REGEX = /^\s*ans =\s\[\]\(1x0\)$/;
	private static setUnconditional(
		breakpoints: Array<ConditionalBreakpoint>,
		confirmedBreakpoints: Array<Breakpoint>,
		fname: string,
		runtime: CommandInterface,
		callback: (breakpoints: Array<Breakpoint>) => void
	): void
	{
		let lines = '';
		breakpoints.forEach(b => lines += `${b.line} `);

		runtime.evaluate(`dbstop ${fname} ${lines}`, (output: string[]) => {
			let i = 0;
			const badBreakpoint = () => {
				const bp = breakpoints[i++];
				const idx = (bp.column? bp.column : 0);
				confirmedBreakpoints[idx] = new Breakpoint(false);
			}
			output.forEach(line => {
				const match = line.match(Breakpoints.BP_REGEX);

				if(match !== null && match.length === 2) {
					const lines = match[1].split(' ').filter((val) => val);
					lines.forEach(l => {
						const bp = breakpoints[i++];
						const idx = (bp.column? bp.column : 0);
						confirmedBreakpoints[idx] = new Breakpoint(true, parseInt(l));
					});
				} else if(Breakpoints.BAD_BP_REGEX.test(line)) {
					badBreakpoint();
				}
			});

			while(i !== breakpoints.length) {
				badBreakpoint()
			}

			callback(confirmedBreakpoints);
		});
	}


	//**************************************************************************
	private static setConditional(
		breakpoints: Array<ConditionalBreakpoint>,
		confirmedBreakpoints: Array<Breakpoint>,
		fname: string,
		runtime: CommandInterface,
		callback: (breakpoints: Array<Breakpoint>) => void
	): void
	{
		let i  = 0;

		breakpoints.forEach(b => {
			const expression = `dbstop in ${fname} at ${b.line} if ${b.condition}`;

			runtime.evaluate(expression, (output: string[]) => {
				output.forEach(line => {
					const match = line.match(Breakpoints.BP_REGEX);

					if(match !== null && match.length === 2) {
						const l = match[1];
						const bp = breakpoints[i++];
						const idx = (bp.column? bp.column : 0);
						confirmedBreakpoints[idx] = new Breakpoint(true, parseInt(l));
					}
				});

				if(i === breakpoints.length) {
					callback(confirmedBreakpoints);
				}
			});
		});
	}


	//**************************************************************************
	private static set(
		breakpoints: Array<ConditionalBreakpoint>,
		path: string,
		runtime: CommandInterface,
		cb: (breakpoints: Array<Breakpoint>) => void
	): void
	{
		const confirmed = new Array<Breakpoint>();
		if(breakpoints.length !== 0) {
			const conditional = new Array<ConditionalBreakpoint>();
			const unconditional = new Array<ConditionalBreakpoint>();
			// Split breakpoints between conditional and unconditional
			breakpoints.forEach(b => {
				b.column = confirmed.length;
				// Breakpoints start unconfirmed, and the column is their index
				confirmed.push(new Breakpoint(false, b.line));
				if(b.condition !== undefined && b.condition.length !== 0) {
					conditional.push(b);
				} else {
					unconditional.push(b);
				}
			});
			// Set breakpoints by type:
			const fname = functionFromPath(path);
			if(unconditional.length !== 0) { // any unconditional breakpoints?
				if(conditional.length !== 0) { // both breakpoint types?
					Breakpoints.setUnconditional(unconditional, confirmed, fname, runtime,
						(confirmed: Array<Breakpoint>) => {
							Breakpoints.setConditional(conditional, confirmed, fname, runtime, cb);
						});
				} else { // only unconditional breakpoints
					Breakpoints.setUnconditional(unconditional, confirmed, fname, runtime, cb);
				}
			} else { // only conditional breakpoints
				Breakpoints.setConditional(conditional, confirmed, fname, runtime, cb);
			}
		} else {
			cb(confirmed);
		}
	}


	//**************************************************************************
	// e.g.
	// debug> dbstatus TestOctaveDebugger
	// breakpoints in TestOctaveDebugger at lines 23 27
	// breakpoint in TestOctaveDebugger>testNestedFunctionLevel2 at line 37
	private static listBreakpointsIn(
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


	//**************************************************************************
	private static clearAllBreakpointsIn(
		path: string,
		ci: CommandInterface,
		callback: () => void
	): void
	{
		Breakpoints.listBreakpointsIn(path, ci, (lines: string) => {
			const func = functionFromPath(path);
			ci.execute(`dbclear ${func} ${lines}`);
			callback();
		});
	}

	//**************************************************************************
	//#endregion
	//**************************************************************************

	//**************************************************************************
	//#region public
	//**************************************************************************
	public static replaceBreakpoints(
		breakpoints: Array<ConditionalBreakpoint>,
		path: string,
		runtime: CommandInterface,
		callback: (breakpoints: Array<Breakpoint>) => void
	): void
	{
		Commands.pushd(runtime, dirname(path),
			(ci: CommandInterface, popd: (ci: CommandInterface) => void) => {
				Breakpoints.clearAllBreakpointsIn(path, ci, () => {
					Breakpoints.set(breakpoints, path, ci,
						(confirmedBreakpoints: Array<Breakpoint>) => {
							popd(ci);
							callback(confirmedBreakpoints);
						}
					);
				});
			}
		);
	}
	//**************************************************************************
	//#endregion
	//**************************************************************************
}
