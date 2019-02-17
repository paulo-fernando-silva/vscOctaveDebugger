import { Variables } from './Variables';
import { Variable } from './Variable';
import { Runtime } from '../Runtime';

//**************************************************************************
// The idea here is that a Scope is a variable that contains other variables.
export class Scope extends Variable {
	//**************************************************************************
	private static readonly HEADER_REGEX = new RegExp(`^(?:${Runtime.PROMPT})*Variables in the current scope:$`);


	//**************************************************************************
	constructor(name: string) {
		super();
		this._name = name;
		// Always keep a reference to scopes. Even ones without children.
		Variables.addReferenceTo(this);
	}


	//**************************************************************************
	public typename(): string { return 'scope'; }


	//**************************************************************************
	public extendedTypename(): string { return this.typename(); }


	//**************************************************************************
	public loads(type: string): boolean { return false; }


	//**************************************************************************
	public loadNew(
		name: string,
		runtime: Runtime,
		callback: (s: Scope) => void
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

		runtime.evaluate(`who ${this.name()}`, (line: string | null) => {
			if(line === null) {
				if(vars.length !== 0) {
					const names = vars.trim().split(/\s+/).sort();
					Variables.listVariables(names, runtime, callback);
				} else {
					callback(new Array<Variable>());
				}
			} else {
				if(matchesHeader && line !== Runtime.PROMPT) {
					vars += ' ' + line;
				} else if(line.match(Scope.HEADER_REGEX) !== null) {
					matchesHeader = true;
				}
			}
		});
	}
}
