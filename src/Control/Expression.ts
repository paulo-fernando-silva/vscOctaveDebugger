import { Runtime } from '../Runtime';
import { Variables } from '../Variables/Variables';
import * as Constants from '../Constants';


//******************************************************************************
export class Expression {
	//**************************************************************************
	public static evaluate(
		expression: string,
		runtime: Runtime,
		ctx: string | undefined,
		callback: (info: string | undefined) => void
	): void
	{
		if(ctx === Constants.CTX_CONSOLE) {
			// Console just passes through.
			runtime.evaluate(expression, callback);
		} else {
			Expression.type(expression, runtime,
				(value: string | undefined, type: string | undefined) => {
					if(value === undefined && type === undefined) {
						callback(Constants.EVAL_UNDEF);
					} else if(ctx === Constants.CTX_HOVER) {
						Expression.handleHover(expression, runtime, value, type, callback);
					} else if(ctx === Constants.CTX_WATCH) {
						// TODO: if variable, then it would be nice to return a variable
						// Note that the user can actually eval a function in watch.
						Expression.forceEvaluate(expression, runtime, callback);
					} else { // and all the rest
						Expression.forceEvaluate(expression, runtime, callback);
					}
				}
			);
		}
	}


	//**************************************************************************
	public static handleHover(
		expression: string,
		runtime: Runtime,
		val: string | undefined,
		type: string | undefined,
		callback: (info: string | undefined) => void
	): void
	{
		// TODO: also skip comments
		if(type !== undefined && (type === 'file' || type === 'function')) {
			callback(val); // Don't evaluate further to avoid side effects
		} else {
			Expression.forceEvaluate(expression, runtime, callback);
		}
	}


	//**************************************************************************
	public static forceEvaluate(
		expression: string,
		runtime: Runtime,
		callback: (info: string | undefined) => void
	): void
	{
		// This really evaluates everything the user wants.
		runtime.evaluate(expression, (value: string) => {
			callback(Variables.removeName(expression, value));
		});
	}


	//**************************************************************************
	public static type(
		expression: string,
		runtime: Runtime,
		callback: (val: string | undefined, type: string | undefined) => void
	): void
	{
		if(expression.match(/^'[^']*$/) !== null) {
			expression = expression.replace('\'', '');
		}

		const typeRegex = new RegExp(`^.*'${expression}' is (?:a|the) (?:built-in )?(\\S+).*$`);
		let syncRegEx;
		let val: string | undefined = undefined;
		let type: string | undefined = undefined;

		runtime.addInputHandler((str: string) => {
			if(str.match(syncRegEx) !== null) {
				callback(val, type);
				return true;
			}

			const match = str.match(typeRegex);
			if(match !== null) {
				val = Runtime.clean(str);
				type = match[1];
			} else if(val === undefined && Runtime.clean(str).length !== 0) {
				val = '';
			}

			return false;
		});

		runtime.send(`which ${expression}`);
		syncRegEx = Runtime.syncRegEx(runtime.sync());
	}
}
