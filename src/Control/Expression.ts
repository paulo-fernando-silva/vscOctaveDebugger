import { Runtime } from '../Runtime';
import * as Constants from '../Constants'


//******************************************************************************
export class Expression {
	//**************************************************************************
	public static evaluate(
		expression: string,
		runtime: Runtime,
		callback: (info: string | undefined) => void
	): void
	{
		if(expression.startsWith(Constants.COMMAND_ESCAPE)) {
			const command = expression.substr(1);
			runtime.evaluate(command, callback);
		} else {
			Expression.isFunction(expression, runtime,
				(info: string | undefined) => {
					if(info === undefined) {
						runtime.evaluate(expression, callback);
					} else {
						callback(info);
					}
				}
			);
		}
	}


	//**************************************************************************
	public static isFunction(
		expression: string,
		runtime: Runtime,
		callback: (info: string | undefined) => void
	): void
	{
		const isFuncRegex = new RegExp(`^.*'${expression}' is a (?:\\S+ )?function from the file .*$`);
		let syncRegEx;
		let val: string | undefined = undefined;

		runtime.addInputHandler((str: string) => {
			if(str.match(syncRegEx) !== null) {
				callback(val);
				return true;
			}

			const match = str.match(isFuncRegex);
			if(match !== null) {
				val = str.replace(Runtime.PROMPT_REGEX, '').trim();
			}

			return false;
		});

		runtime.send(`which ${expression}`);
		syncRegEx = Runtime.syncRegEx(runtime.sync());
	}
}
