/*******************************************************************************
Copyright 2018 Paulo Silva

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 ******************************************************************************/
import {
	DebugSession, LoggingDebugSession,
	InitializedEvent, TerminatedEvent, StoppedEvent,
	Thread, StackFrame, Scope, Breakpoint, Variable
} from 'vscode-debugadapter';
import { OctaveLogger } from './OctaveLogger';
import { DebugProtocol } from 'vscode-debugprotocol';
import * as Constants from './Constants';
import { Runtime } from './Runtime';
import { CommandInterface } from './Commands';
import { Breakpoints } from './Breakpoints';
import { Expression } from './Expression';
import { StackFramesManager } from './StackFramesManager';
import { Variables } from './Variables/Variables';
import { Variable as OctaveVariable } from './Variables/Variable';
import { UnknownType } from './Variables/UnknownType'
import { Scalar } from './Variables/Scalar';
import { Bool } from './Variables/Bool';
import { String } from './Variables/String';
import { Matrix } from './Variables/Matrix';
import { SparseMatrix } from './Variables/SparseMatrix';
import { ComplexDiagonalMatrix } from './Variables/ComplexDiagonalMatrix';
import { LazyIndex } from './Variables/LazyIndex';
import { Range } from './Variables/Range';
import { Struct } from './Variables/Struct';
import { ScalarStruct } from './Variables/ScalarStruct';
import { Function } from './Variables/Function'
import { Cell } from './Variables/Cell';
import { Scope as OctaveScope } from './Variables/Scope';
import { isMatlabFile, validDirectory } from './Utils/fsutils';
import { dirname } from 'path';
import { CommandList } from './CommandList';


//******************************************************************************
interface LaunchRequestArguments extends DebugProtocol.LaunchRequestArguments {
	/** An absolute path to the "program" to debug. */
	program: string;
	/** Path to the octave-cli. */
	octave: string;
	/** Absolute path to the project source folder. Defaults to workspace folder. */
	sourceFolder?: string;
	/** Absolute path to the desired working directory. Defaults to program location. */
	workingDirectory?: string;
	/** Enable verbose logging of the Debug Adapter Protocol. */
	verbose?: boolean;
	/** Output verbose logging to file. */
	logFilename?: string;
	/** Maximum number of chunks of elements to prefetch. */
	prefetchCount?: number;
	/** Enable ans evaluation. */
	evaluateAns?: boolean;
	/** Terminates Octave process when debug runs beyond the end of the program. */
	autoTerminate?: boolean;
	/** Enable fieldnames containing an almost arbitrary format. */
	splitFieldnamesOctaveStyle?: boolean;
}


//******************************************************************************
class OctaveDebugSession extends LoggingDebugSession {
	private static readonly THREAD_ID = 1;
	private _stepCount = 0;
	private _runtime: Runtime;
	private _stackManager: StackFramesManager;
	private _breakpointsCallbacks = new Array<(ci: CommandInterface) => void>();
	private _stepping: boolean;
	private _runCallback: () => void;
	private _configurationDone = false;


	//**************************************************************************
	public constructor() {
		super();

		this._stackManager = new StackFramesManager();

		// In Matlab every index starts at 1
		this.setDebuggerLinesStartAt1(true);
		this.setDebuggerColumnsStartAt1(true);

		this.setupVariables();
	}


	//**************************************************************************
	private setupVariables(): void {
		// These are the supported variables factories.
		Variables.register(new Range());
		Variables.register(new Scalar());
		Variables.register(new SparseMatrix()); // Needs to come before matrix to override load
		Variables.register(new ComplexDiagonalMatrix());
		Variables.register(new Matrix());
		Variables.register(new LazyIndex());
		Variables.register(new Struct());
		Variables.register(new ScalarStruct());
		Variables.register(new String());
		Variables.register(new Bool());
		Variables.register(new Function());
		Variables.register(new Cell());
		// Everything not listed above is treated as a UnknownType.
		Variables.registerFallback(new UnknownType());
	}


	//**************************************************************************
	private sendTerminatedEvent() {
		this.sendEvent(new TerminatedEvent());
	}


	//**************************************************************************
	private static readonly STOP_REGEX = /^stopped in .*? at line \d+$/;
	private setupRuntime(
		octave: string,
		sourceFolder: string,
		autoTerminate: boolean
	)
	{
		if(this._runtime) {
			return;
		}

		OctaveLogger.logToConsole = this._isServer;
		this._runtime = new Runtime(octave, sourceFolder, autoTerminate);

		if(!this.runtimeConnected()) {
			OctaveLogger.warn(`Could not connect to '${octave}'! Check path.`);
			return;
		}

		this._runtime.on(Constants.eEXIT, () => this.sendTerminatedEvent());
		this._runtime.on(Constants.eEND, () => this.sendTerminatedEvent());
		this._runtime.on(Constants.eERROR, () => this.sendTerminatedEvent());
		this._runtime.addStderrHandler((line: string) => {
			if(line.match(OctaveDebugSession.STOP_REGEX) !== null) {
				this.sendEvent(new StoppedEvent('breakpoint', OctaveDebugSession.THREAD_ID));
				this._stepping = false;
				return true; // Event handled. Stop processing.
			}

			return false; // Event not handled. Pass the event to the next handler.
		});
	}


	//**************************************************************************
	public runtimeConnected(): boolean {
		return this._runtime.connected();
	}


	//**************************************************************************
	protected initializeRequest(
		response: DebugProtocol.InitializeResponse,
		args: DebugProtocol.InitializeRequestArguments
	): void
	{
		this.sendEvent(new InitializedEvent());

		response.body = response.body || {};
		response.body.supportsConfigurationDoneRequest = true;
		response.body.supportsEvaluateForHovers = true;
		response.body.supportsConditionalBreakpoints = true;
		response.body.supportsHitConditionalBreakpoints = true;
		response.body.supportsSetVariable = true;
		response.body.supportsStepBack = false;
		response.body.supportTerminateDebuggee = true;

		this.sendResponse(response);
	}


	//**************************************************************************
	protected disconnectRequest(
		response: DebugProtocol.DisconnectResponse,
		args: DebugProtocol.DisconnectArguments
	): void
	{
		this._runtime.disconnect();
		this.sendResponse(response);
	}


	//**************************************************************************
	protected configurationDoneRequest(
		response: DebugProtocol.ConfigurationDoneResponse,
		args: DebugProtocol.ConfigurationDoneArguments
	): void
	{
		super.configurationDoneRequest(response, args);

		this._configurationDone = true;
		if(this._runCallback) {
			this._runCallback();
		}
	}


	//**************************************************************************
	private static getWorkingDirectory(args: LaunchRequestArguments): string {
		if(args.workingDirectory !== undefined && validDirectory(args.workingDirectory)) {
			return args.workingDirectory;
		}

		const programDirectory = dirname(args.program);
		if(validDirectory(programDirectory)) {
			return programDirectory;
		}

		// If the debugger was already running we could find the directory of the "program"
		if(args.sourceFolder !== undefined && validDirectory(args.sourceFolder)) {
			return args.sourceFolder;
		}

		return '';
	}


	//**************************************************************************
	private val(value: any, _default: any): any {
		if(value !== undefined && value !== null) {
			return value;
		}
		return _default;
	}


	//**************************************************************************
	protected async launchRequest(
		response: DebugProtocol.LaunchResponse,
		args: LaunchRequestArguments
	)
	{
		OctaveLogger.setup(args.verbose, args.logFilename);
		Variables.evaluateAns = this.val(args.evaluateAns, false);

		if(args.splitFieldnamesOctaveStyle !== undefined) {
			ScalarStruct.setSplitStyle(args.splitFieldnamesOctaveStyle);
		}

		if(args.prefetchCount !== undefined) {
			Variables.setChunkPrefetch(args.prefetchCount);
		}

		this.setupRuntime(
			this.val(args.octave, Constants.DEFAULT_EXECUTABLE),
			this.val(args.sourceFolder, ''),
			this.val(args.autoTerminate, true));
		const workingDirectory = OctaveDebugSession.getWorkingDirectory(args);

		if(this.runtimeConnected()) {
			this.runSetBreakpoints();

			if(!this._configurationDone) {
				this._runCallback = () => {
					this._runtime.start(args.program, workingDirectory);
				};
			} else {
				this._runtime.start(args.program, workingDirectory);
			}
		}

		this.sendResponse(response);
	}


	//**************************************************************************
	private runSetBreakpoints() {
		if(this._runtime && this._breakpointsCallbacks.length !== 0) {
			const cl = new CommandList(this._stepCount);
			this._breakpointsCallbacks.forEach(callback => {
				callback(cl);
			});
			this._breakpointsCallbacks.length = 0;
			this.executeCommandList(cl, () => {});
		}
	}


	//**************************************************************************
	private handleInvalidBreakpoints(
		response: DebugProtocol.SetBreakpointsResponse,
		args: DebugProtocol.SetBreakpointsArguments
	): void
	{
		if(args.breakpoints !== undefined) {
			const breakpoints = args.breakpoints.map(bp =>
				<Breakpoint>{ verified: false, source: args.source, line: bp.line });
			response.body = { breakpoints: breakpoints };
			this.sendResponse(response);
		}
	}


	//**************************************************************************
	protected setBreakPointsRequest(
		response: DebugProtocol.SetBreakpointsResponse,
		args: DebugProtocol.SetBreakpointsArguments
	): void
	{
		if(!isMatlabFile(args.source)) {
			return this.handleInvalidBreakpoints(response, args);
		}

		const callback = (ci: CommandInterface) => {
			const vscBreakpoints = args.breakpoints;
			if(vscBreakpoints !== undefined && args.source.path !== undefined) {
				const path = <string>args.source.path;

				Breakpoints.replaceBreakpoints(vscBreakpoints, path, ci,
					(breakpoints: Array<Breakpoint>) => {
						response.body = { breakpoints: breakpoints };
						this.sendResponse(response);
					}
				);
			} else {
				this.sendResponse(response);
			}
		};

		if(this._runtime) {
			const cl = new CommandList(this._stepCount);
			callback(cl);
			this.executeCommandList(cl, () => {});
		} else {
			this._breakpointsCallbacks.push(callback);
		}
	}


	//**************************************************************************
	protected threadsRequest(response: DebugProtocol.ThreadsResponse): void {
		response.body = {
			threads: [
				new Thread(	OctaveDebugSession.THREAD_ID,
							`thread ${OctaveDebugSession.THREAD_ID}`)
			]
		};
		this.sendResponse(response);
	}


	//**************************************************************************
	protected stackTraceRequest(
		response: DebugProtocol.StackTraceResponse,
		args: DebugProtocol.StackTraceArguments
	): void
	{
		const startFrame = typeof args.startFrame === 'number' ? args.startFrame : 0;
		const maxLevels = typeof args.levels === 'number' ? args.levels : 1000;
		const endFrame = startFrame + maxLevels;

		// Each time the program reaches any new instruction it requests the stack.
		// Since it'll recreate the scopes and variables, we clear them here.
		this.clear();

		const callback = (stackFrames: Array<StackFrame>) => {
			response.body = {
				stackFrames: stackFrames,
				totalFrames: stackFrames.length
			};

			this.sendResponse(response);
		};

		this._stackManager.get(startFrame, endFrame, this._runtime, callback);
	}


	//**************************************************************************
	protected scopesRequest(
		response: DebugProtocol.ScopesResponse,
		args: DebugProtocol.ScopesArguments
	): void
	{
		const callback = () => {
			// All stack frames have local and global scopes.
			const localScope = new OctaveScope(''); // local scope has no name.
			const globalScope = new OctaveScope('global');
			// Tell the UI which scopes are available.
			response.body = { scopes: [
				new Scope('local', localScope.reference(), false),
				new Scope(globalScope.name(), globalScope.reference(), false)
			]};

			this.sendResponse(response);
		};

		this._stackManager.selectStackFrame(args.frameId, this._runtime, callback);
	}


	//**************************************************************************
	private static readonly EMPTY_VARS = new Array<OctaveVariable>();
	protected variablesRequest(
		response: DebugProtocol.VariablesResponse,
		args: DebugProtocol.VariablesArguments
	): void
	{
		const callback = (variables: Array<OctaveVariable>) => {
			response.body = {
				variables: variables.map(v => <Variable>{
					name: v.name(),
					type: v.extendedTypename(),
					value: v.value(),
					variablesReference: v.reference(),
					namedVariables: v.namedVariables(),
					indexedVariables: v.indexedVariables()
				})
			};
			this.sendResponse(response);
		};

		const count = args.count || 0;
		const start = args.start || 0;

		const cl = new CommandList(this._stepCount);
		Variables.listByReference(args.variablesReference, cl, count, start, callback);
		this.executeCommandList(cl, () => { callback(OctaveDebugSession.EMPTY_VARS); });
	}


	//**************************************************************************
	protected setVariableRequest(
		response: DebugProtocol.SetVariableResponse,
		variable: DebugProtocol.SetVariableArguments
	): void
	{
		Variables.setVariable(	variable.name,
								variable.value,
								this._runtime,
			(newValue: string) => {
				response.body = { value: newValue };
				this.sendResponse(response);
			});
	}


	//**************************************************************************
	protected evaluateRequest(
		response: DebugProtocol.EvaluateResponse,
		args: DebugProtocol.EvaluateArguments
	): void
	{
		const sendResponse = (val: string) => {
			response.body = {
				result: val,
				variablesReference: 0
			};
			this.sendResponse(response);
		};

		Expression.evaluate(args.expression, this._runtime, args.context, sendResponse);
	}


	//**************************************************************************
	private static readonly WHERE_REGEX = /stopped at top level/;
	protected stepWith(cmd: string): void {
		this._stepping = this._runtime.autoTerminate();
		++this._stepCount;

		this._runtime.evaluateAsLine(cmd, (output: string) => {
			// Prints output from program done during step
			OctaveLogger.log(output);

			if(this._stepping) {
				this._stepping = false;
				this._runtime.evaluateAsLine('dbwhere', (output: string) => {
					if(output.match(OctaveDebugSession.WHERE_REGEX)) {
						this.sendTerminatedEvent();
					}
				});
			}
		});
	}


	//**************************************************************************
	protected continueRequest(
		response: DebugProtocol.ContinueResponse,
		args: DebugProtocol.ContinueArguments
	): void
	{
		this._runtime.execute('dbcont');
		this.sendResponse(response);
	}


	//**************************************************************************
	protected nextRequest(
		response: DebugProtocol.NextResponse,
		args: DebugProtocol.NextArguments
	): void
	{
		this.stepWith('dbstep');
		this.sendResponse(response);
	}


	//**************************************************************************
	protected stepInRequest(
		response: DebugProtocol.StepInResponse,
		args: DebugProtocol.StepInArguments
	): void
	{
		this.stepWith('dbstep in');
		this.sendResponse(response);
	}


	//**************************************************************************
	protected stepOutRequest(
		response: DebugProtocol.StepOutResponse,
		args: DebugProtocol.StepOutArguments
	): void
	{
		this.stepWith('dbstep out');
		this.sendResponse(response);
	}


	//**************************************************************************
	protected pauseRequest(
		response: DebugProtocol.PauseResponse,
		args: DebugProtocol.PauseArguments
	): void
	{
		// args can be ignored as there's only one thread.
		OctaveLogger.warn('Pausing...');
		this._runtime.pause();
		this.sendResponse(response);
	}


	//**************************************************************************
	private clear(): void {
		Variables.clearReferences();
		this._stackManager.clear();
	}


	//**************************************************************************
	private executeCommandList(cl: CommandList, canceled: () => void) {
		const self = this;

		const execute = (cl: CommandList) => {
			if(!cl.empty()) {
				if(cl.id() === self._stepCount) {
					cl.executeCommandList(self._runtime, execute);
				} else {
					// I believe this branch is never taken because of how node.js executes.
					canceled();
				}
			}
		}

		execute(cl);
	}
}

DebugSession.run(OctaveDebugSession);
