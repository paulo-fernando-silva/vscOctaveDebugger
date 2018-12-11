import { Variables } from './Variables';
import { Variable } from './Variable';
import { Runtime } from '../Runtime';

//**************************************************************************
// The idea here is that a Scope is a variable that contains other variables.
export class Scope extends Variable  {
	//**************************************************************************
	private static readonly HEADER_REGEX = new RegExp(`^(?:${Runtime.PROMPT})*Variables in the current scope:$`);


	//**************************************************************************
	constructor(name: string) {
		super();
		this._name = name;
		Variables.addReferenceTo(this);
	}


	//**************************************************************************
	public typename(): string { return 'scope'; }


	//**************************************************************************
	public extendedTypename(): string { return this.typename(); }


	//**************************************************************************
	public loads(type: string): boolean {
		return false;
	}


	//**************************************************************************
	public load(
		name: string,
		runtime: Runtime,
		callback: (v: Variable) => void
	): void
	{}


	//**************************************************************************
	public listChildren(
		runtime: Runtime,
		count: number,
		start: number,
		callback: (vars: Array<Variable>) => void
	): void
	{
		let matchesHeader = false;
		let vars = '';
		let syncRegex;

		runtime.addInputHandler((str: string) => {
			if(str.match(syncRegex) !== null) {
				if(vars.length !== 0) {
					const names = vars.trim().split(/\s+/).sort();
					Variables.listVariables(names, runtime, callback);
				} else {
					callback(new Array<Variable>());
				}

				return true;
			}

			if(matchesHeader && str !== Runtime.PROMPT) {
				vars += ' ' + str;
			} else if(str.match(Scope.HEADER_REGEX) !== null) {
				matchesHeader = true;
			}

			return false;
		});

		runtime.send(`who ${this.name()}`);
		syncRegex = Runtime.syncRegEx(runtime.sync());
	}
}
