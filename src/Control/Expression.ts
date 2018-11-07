//******************************************************************************
import { Runtime } from '../Runtime';


//******************************************************************************
export class Expression {
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
