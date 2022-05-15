import { CommandInterface } from '../Commands';


//******************************************************************************
// Variables representation of "Data Types" seen here:
// https://www.mathworks.com/help/matlab/data-types_data-types.html
// This class design is "somewhat" influenced by the DebugProtocol.Variable.
//
// I could choose to add an abstract method that would return the
// DebugProtocol.Variable for the corresponding concrete type,
// but that would coulpe the two APIs even more.
export abstract class Variable {
	//**************************************************************************
	protected _name: string = '';
	protected _value: string = '';
	protected _reference: number = 0;
	protected _namedVariables: number = 0;
	protected _numberOfChildren: number = 0;


	//**************************************************************************
	public abstract loadNew(
		name: string,
		type: string,
		runtime: CommandInterface,
		callback: (v: Variable) => void): void;


	//**************************************************************************
	public abstract listChildren(
		runtime: CommandInterface,
		start: number,
		count: number,
		callback: (vars: Array<Variable>) => void): void;


	//**************************************************************************
	public abstract loads(type: string): boolean;


	//**************************************************************************
	public abstract typename(): string;


	//**************************************************************************
	public abstract extendedTypename(): string;


	//**************************************************************************
	public name(): string { return this._name; }


	//**************************************************************************
	public value(): string { return this._value; }


	//**************************************************************************
	public reference(): number { return this._reference; }


	//**************************************************************************
	public namedVariables(): number { return this._namedVariables; }


	//**************************************************************************
	public indexedVariables(): number { return this._numberOfChildren; }


	//**************************************************************************
	public setReference(ref: number): void { this._reference = ref; }
}
