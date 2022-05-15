import { CommandInterface } from '../Commands';
import { Variables } from './Variables';
import { Variable } from './Variable';

//**************************************************************************
// The idea here is that a Scope is a variable that contains other variables.
export class Scope extends Variable {
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
		type: string,
		runtime: CommandInterface,
		callback: (s: Scope) => void
	): void
	{}


	//**************************************************************************
	private static readonly HEADER_REGEX = /^\s*Variables .* the current scope:$/;
	private static readonly SPACE_REGEX = /\s+/;
	//**************************************************************************
	public listChildren(
		runtime: CommandInterface,
		start: number,
		count: number,
		callback: (vars: Array<Variable>) => void
	): void
	{
		let matchesHeader = false;
		let vars = '';

		runtime.evaluate(`who ${this.name()}`, (output: string[]) => {
			output.forEach(line => {
				if(matchesHeader) {
					vars += ' ' + line;
				} else if(Scope.HEADER_REGEX.test(line)) {
					matchesHeader = true;
				}
			});

			if(vars.length !== 0) {
				const names = vars.trim().split(Scope.SPACE_REGEX).sort();
				Variables.listVariables(names, runtime, callback);
			} else {
				callback(new Array<Variable>());
			}
		});
	}
}
