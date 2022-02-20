import { Variables } from './Variables/Variables';
import { Variable } from './Variables/Variable';
import { CommandInterface } from './Commands';
import * as Constants from './Constants';


//******************************************************************************
export class Expression {
	//**************************************************************************
	private static readonly CLEAN_REGEX = /\s*'\s*/g;
	private static readonly NAME_REGEX = /^([_A-Za-z]\w*).*$/;

	public static evaluate(
		expression: string,
		runtime: CommandInterface,
		ctx: string | undefined,
		callback: (info: string | undefined, ref: number) => void
	): void
	{
		if(ctx === Constants.CTX_CONSOLE) {
			// Console just passes through.
			runtime.execute(expression);
			// We don't send anything back now as any output will be written on the console anyway.
			// This also avoids the issue with the pause, input, etc.
			callback('', 0);
		} else {
			// fixes an issue with vsc not knowing how to parse Octave code.
			// i.e. if you hover 'var', expression will equal 'var or '' if empty
			const hoverExpression = expression.replace(Expression.CLEAN_REGEX, '');
			// some function calls require variable name without indexing
			const variableName = Expression.parseName(expression);

			if(hoverExpression !== '') {
				Expression.type(variableName, runtime,
					(value: string | undefined, type: string | undefined) => {
						if(value === undefined && type === undefined) {
							callback(Constants.EVAL_UNDEF, 0);
						} else if(ctx === Constants.CTX_HOVER || ctx === Constants.CTX_WATCH) {
							Expression.handleHover(hoverExpression, runtime, value, type, callback);
						} else { // and all the rest
							Expression.forceEvaluate(expression, runtime, callback);
						}
					}
				);
			} else {
				callback(Constants.EVAL_UNDEF, 0);
			}
		}
	}


	//**************************************************************************
	public static handleHover(
		expression: string,
		runtime: CommandInterface,
		val: string | undefined,
		type: string | undefined,
		callback: (info: string | undefined, ref: number) => void
	): void
	{
		// TODO: also skip comments
		if(type !== undefined && (type === 'file' || type === 'function')) {
			callback(val, 0); // Don't evaluate further to avoid side effects
		} else {
			Expression.loadAsVariable(expression, runtime, callback);
		}
	}


	//**************************************************************************
	public static loadAsVariable(
		expression: string,
		runtime: CommandInterface,
		callback: (info: string | undefined, ref: number) => void
	): void
	{
		// Try fetching from cache:
		const ref = Variables.getReference(expression);

		if(ref == 0) {
			Variables.loadVariable(expression, runtime, (v: Variable | null) => {
				if(v === null) {
					Variables.getSize(expression, runtime, (size: Array<number>) => {
						if(Variables.loadable(size)) {
							Expression.forceEvaluate(expression, runtime, callback);
						} else {
							callback(size.join(Constants.SIZE_SEPARATOR), 0);
						}
					});
				} else {
					callback(v.value(), v.indexedVariables() !== 0 ? v.reference() : 0);
				}
			});
		} else {
			callback(undefined, ref);
		}
	}


	//**************************************************************************
	public static forceEvaluate(
		expression: string,
		runtime: CommandInterface,
		callback: (info: string | undefined, ref: number) => void
	): void
	{
		runtime.evaluateAsLine(expression, (output: string) => {
			callback(Variables.removeName(expression, output), 0);
		});
	}


	//**************************************************************************
	private static parseName(expression: string): string {
		const match = expression.match(Expression.NAME_REGEX);
		if(match !== null) {
			return match[1];
		}
		return expression;
	}

	//**************************************************************************
	public static type(
		expression: string,
		runtime: CommandInterface,
		callback: (val: string | undefined, type: string | undefined) => void
	): void
	{
		const typeRegex = new RegExp(`^.*'${expression}' is (?:a|the) (?:built-in )?(\\S+).*$`);
		let val: string | undefined = undefined;
		let type: string | undefined = undefined;

		runtime.evaluate(`which ${expression}`, (output: string[]) => {
			output.forEach(line => {
				const match = line.match(typeRegex);

				if(match !== null) {
					val = line;
					type = match[1];
				} else if(val === undefined && line.length !== 0) {
					val = '';
				}
			});

			callback(val, type);
		});
	}
}
