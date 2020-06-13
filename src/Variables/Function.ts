import { CommandInterface } from '../Commands';
import { Variables } from './Variables';
import { Variable } from './Variable';


export class Function extends Variable {
	//**************************************************************************
	private static BASE_TYPE: string = 'function';
	private _typename: string = Function.BASE_TYPE;


	//**************************************************************************
	constructor(
		name: string = '',
		value: string = '',
		type: string = Function.BASE_TYPE
	)
	{
		super();
		this._name = name;
		this._value = value;
		this._typename = type;
	}


	//**************************************************************************
	public typename(): string { return this._typename; }


	//**************************************************************************
	public loads(type: string): boolean {
		return type.includes(this.typename());
	}


	//**************************************************************************
	public extendedTypename(): string { return this.typename(); }


	//**************************************************************************
	public createConcreteType(
		name: string,
		value: string,
		type: string
	): Function
	{
		return new Function(name, value, type);
	}


	//**************************************************************************
	public loadNew(
		name: string,
		type: string,
		runtime: CommandInterface,
		callback: (s: Function) => void
	): void
	{
		Variables.getValue(name, runtime, (value: string) => {
			callback(this.createConcreteType(name, value, type));
		});
	}


	//**************************************************************************
	public listChildren(
		runtime: CommandInterface,
		count: number,
		start: number,
		callback: (vars: Array<Variable>) => void
	): void
	{} // Function have no children.
}
