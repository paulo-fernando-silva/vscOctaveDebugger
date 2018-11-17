import { Runtime } from '../Runtime';


//******************************************************************************
export class Expression {
	//**************************************************************************
	public static evaluate(
		expression: string,
		runtime: Runtime,
		isConsole: boolean,
		callback: (info: string | undefined) => void
	): void
	{
		if(isConsole) {
			runtime.evaluate(expression, callback);
		} else {
			Expression.isFunction(expression, runtime,
				(info: string | undefined, exists: boolean) => {
					if(exists) {
						if(info === undefined) {
							runtime.evaluate(expression, callback);
						} else {
							callback(info);
						}
					}
				}
			);
		}
	}


	//**************************************************************************
	public static isFunction(
		expression: string,
		runtime: Runtime,
		callback: (info: string | undefined, exists: boolean) => void
	): void
	{
		const isFuncRegex = new RegExp(`^.*'${expression}' is a (?:\\S+ )?function from the file .*$`);
		let syncRegEx;
		let val: string | undefined = undefined;
		let exists = false;

		runtime.addInputHandler((str: string) => {
			if(str.match(syncRegEx) !== null) {
				callback(val, exists);
				return true;
			}

			exists = true;
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
