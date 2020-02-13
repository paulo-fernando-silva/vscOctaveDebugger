import { CommandInterface } from '../Runtime';
import { Variables } from './Variables';
import { Variable } from './Variable';


export class SqString extends Variable {
	//**************************************************************************
	constructor(
		name: string = '',
		value: string = ''
	)
	{
		super();
		this._name = name;
		this._value = value;
	}


	//**************************************************************************
	public typename(): string { return 'sq_string'; }


	//**************************************************************************
	public loads(type: string): boolean { return type === this.typename(); }


	//**************************************************************************
	public extendedTypename(): string { return this.typename(); }


	//**************************************************************************
	public createConcreteType(
		name: string,
		value: string
	): SqString
	{
		return new SqString(name, value);
	}


	//**************************************************************************
	public loadNew(
		name: string,
		type: string,
		runtime: CommandInterface,
		callback: (s: SqString) => void
	): void
	{
		Variables.getValue(name, runtime, (value: string) => {
			callback(this.createConcreteType(name, value));
		});
	}


	//**************************************************************************
	public listChildren(
		runtime: CommandInterface,
		count: number,
		start: number,
		callback: (vars: Array<Variable>) => void
	): void
	{} // SqString have no children.
}
