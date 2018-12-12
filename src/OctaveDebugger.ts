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
import { OctaveLogger } from './Utils/OctaveLogger';
import { DebugProtocol } from 'vscode-debugprotocol';
import * as Constants from './Constants';
import { Runtime } from './Runtime';
import { Breakpoints } from './Control/Breakpoints';
import { Expression } from './Control/Expression';
import { StackFramesManager } from './Control/StackFramesManager';
import { Variables } from './Variables/Variables';
import { Variable as OctaveVariable } from './Variables/Variable';
import { Scalar } from './Variables/Scalar';
import { Matrix } from './Variables/Matrix';
import { ComplexMatrix } from './Variables/ComplexMatrix';
import { ScalarStruct } from './Variables/ScalarStruct';
import { Struct } from './Variables/Struct';
import { Scope as OctaveScope } from './Variables/Scope';
import { isMatlabFile } from './Utils/misc';


//******************************************************************************
interface LaunchRequestArguments extends DebugProtocol.LaunchRequestArguments {
	/** An absolute path to the "program" to debug. */
	program: string;
	/** Enable logging the Debug Adapter Protocol. */
	trace: boolean;
	/** Enable verbose logging the Debug Adapter Protocol. */
	verbose?: boolean;
	/** Enable ans evaluation. */
	evaluateAns?: boolean;
	/** Path to the octave-cli. */
	octave: string;
	/** Absolute path to the project source folder. */
	sourceFolder: string;
	/** Maximum number of chunks of elements to prefetch. */
	prefetchCount: number;
}


//******************************************************************************
class OctaveDebugSession extends LoggingDebugSession {
	private static THREAD_ID = 1;
	private _stepCount = 0;
	private _runtime: Runtime;
	private _stackManager: StackFramesManager;
	private _breakpointsCallbacks = new Array<(r: Runtime) => void>();
	private _stepping: boolean;
	private _runCallback: () => void;
	private _configurationDone = false;


	//**************************************************************************
	public constructor() {
		super(`${Constants.MODULE_NAME}.txt`);

		this._stackManager = new StackFramesManager();

		// In matlab every index starts at 1
		this.setDebuggerLinesStartAt1(true);
		this.setDebuggerColumnsStartAt1(true);

		this.setupVariables();
	}


	//**************************************************************************
	private setupVariables(): void {
		// These are the supported variables factories.
		Variables.register(new ScalarStruct());
		Variables.register(new Struct());
		Variables.register(new Matrix());
		Variables.register(new ComplexMatrix());
		// Everything not listed above is treated as a Scalar (string).
		Variables.registerFallback(new Scalar());
	}


	//**************************************************************************
	private setupRuntime(
		octave: string,
		sourceFolder: string
	)
	{
		if(this._runtime) {
			return;
		}

		this._runtime = new Runtime(octave, sourceFolder);

		if(!this.runtimeConnected()) {
			OctaveLogger.warn(`Could not connect to '${octave}'! Check path.`);
			return;
		}

		this._runtime.on('exit', () => {
			this.sendEvent(new TerminatedEvent());
		});
		this._runtime.on('end', () => {
			this.sendEvent(new TerminatedEvent());
		});
		this._runtime.on('error', () => {
			this.sendEvent(new TerminatedEvent());
		});
		this._runtime.addEventHandler((line: string) => {
			if(line.match(/^stopped in .*? at line \d+$/) !== null) {
				OctaveLogger.debug(`Sending breakpoint: '${this._stepCount}'`);
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
	protected async launchRequest(
		response: DebugProtocol.LaunchResponse,
		args: LaunchRequestArguments
	)
	{
		OctaveLogger.setup(args.trace, args.verbose);
		Variables.setChunkPrefetch(args.prefetchCount);
		Variables.evaluateAns = (args.evaluateAns !== undefined && args.evaluateAns);

		this.setupRuntime(args.octave, args.sourceFolder);

		if(this.runtimeConnected()) {
			this.runSetBreakpoints();

			if(!this._configurationDone) {
				this._runCallback = () => {
					this._runtime.start(args.program);
				};
			} else {
				this._runtime.start(args.program);
			}
		}

		this.sendResponse(response);
	}


	//**************************************************************************
	private runSetBreakpoints() {
		if(this._runtime && this._breakpointsCallbacks.length !== 0) {
			this._breakpointsCallbacks.forEach(callback => {
				callback(this._runtime);
			});
			this._breakpointsCallbacks.length = 0;
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
		OctaveLogger.debug(`setBreakpoints: request '${this._stepCount}'`);
		if(!isMatlabFile(args.source)) {
			return this.handleInvalidBreakpoints(response, args);
		}

		const callback = (runtime: Runtime) => {
			const vscBreakpoints = args.breakpoints;
			if(vscBreakpoints !== undefined && args.source.path !== undefined) {
				const path = <string>args.source.path;

				Breakpoints.clearAllBreakpointsIn(path, runtime, () => {
					Breakpoints.set(vscBreakpoints, path, runtime,
						(breakpoints: Array<Breakpoint>) => {
							response.body = { breakpoints: breakpoints };
							this.sendResponse(response);
							OctaveLogger.debug(`setBreakpoints: response '${this._stepCount}'`);
						}
					);
				});
			} else {
				this.sendResponse(response);
				OctaveLogger.debug(`setBreakpoints: response '${this._stepCount}'`);
			}
		};

		if(this._runtime) {
			callback(this._runtime);
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
		OctaveLogger.debug(`stackTrace: clear '${this._stepCount}'`);
		this.clear();

		OctaveLogger.debug(`stackTrace: request '${this._stepCount}'`);

		const callback = (stackFrames: Array<StackFrame>) => {
			response.body = {
				stackFrames: stackFrames,
				totalFrames: stackFrames.length
			};

			this.sendResponse(response);
			OctaveLogger.debug(`stackTrace: response '${this._stepCount}'`);
		};

		this._stackManager.get(startFrame, endFrame, this._runtime, callback);
	}


	//**************************************************************************
	protected scopesRequest(
		response: DebugProtocol.ScopesResponse,
		args: DebugProtocol.ScopesArguments
	): void
	{
		OctaveLogger.debug(`scopeRequest: request '${this._stepCount}'`);
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
			OctaveLogger.debug(`scopeRequest: response '${this._stepCount}'`);
		};

		this._stackManager.selectStackFrame(args.frameId, this._runtime, callback);
	}


	//**************************************************************************
	protected variablesRequest(
		response: DebugProtocol.VariablesResponse,
		args: DebugProtocol.VariablesArguments
	): void
	{
		OctaveLogger.debug(`variablesRequest: request '${this._stepCount}'`);
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
			OctaveLogger.debug(`variablesRequest: response '${this._stepCount}'`);
		};

		const count = args.count || 0;
		const start = args.start || 0;
		Variables.listByReference(	args.variablesReference,
									this._runtime,
									count,
									start,
									callback);
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
		OctaveLogger.debug(`evaluateRequest: request '${this._stepCount}'`);
		const sendResponse = (val: string) => {
				response.body = {
				result: val,
				variablesReference: 0
			};
			this.sendResponse(response);
			OctaveLogger.debug(`evaluateRequest: request '${this._stepCount}'`);
		};

		Expression.evaluate(args.expression, this._runtime, args.context, sendResponse);
	}


	//**************************************************************************
	protected stepWith(cmd: string, responseCallback: () => void): void {
		this._stepping = true;
		OctaveLogger.debug(`stepRequest: request '${++this._stepCount}'`);

		this._runtime.waitSend(cmd, () => {
			if(this._stepping) {
				this.sendEvent(new TerminatedEvent());
				this._stepping = false;
			}
		});

		responseCallback(); // It seems we need to respond immediately.
		OctaveLogger.debug(`stepRequest: response '${this._stepCount}'`);
	}


	//**************************************************************************
	protected continueRequest(
		response: DebugProtocol.ContinueResponse,
		args: DebugProtocol.ContinueArguments
	): void
	{
		this.stepWith('dbcont', () => { this.sendResponse(response); });
	}


	//**************************************************************************
	protected nextRequest(
		response: DebugProtocol.NextResponse,
		args: DebugProtocol.NextArguments
	): void
	{
		this.stepWith('dbstep', () => { this.sendResponse(response); });
	}


	//**************************************************************************
	protected stepInRequest(
		response: DebugProtocol.StepInResponse,
		args: DebugProtocol.StepInArguments
	): void
	{
		this.stepWith('dbstep in', () => { this.sendResponse(response); });
	}


	//**************************************************************************
	protected stepOutRequest(
		response: DebugProtocol.StepOutResponse,
		args: DebugProtocol.StepOutArguments
	): void
	{
		this.stepWith('dbstep out', () => { this.sendResponse(response); });
	}


	//**************************************************************************
	private clear(): void {
		Variables.clearReferences();
		this._stackManager.clear();
	}
}

DebugSession.run(OctaveDebugSession);
