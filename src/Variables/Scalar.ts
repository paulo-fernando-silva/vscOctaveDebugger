import { Variables } from './Variables';
import { Variable } from './Variable';
import { Runtime } from '../Runtime';


export class Scalar extends Variable {
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
	public typename(): string { return 'scalar'; }


	//**************************************************************************
	public extendedTypename(): string { return this.typename(); }


	//**************************************************************************
	public loads(type: string): boolean { return type === this.typename(); }


	//**************************************************************************
	public createConcreteType(
		name: string,
		value: string
	): Scalar
	{
		return new Scalar(name, value);
	}


	//**************************************************************************
	public loadNew(
		name: string,
		runtime: Runtime,
		callback: (s: Scalar) => void
	): void
	{
		// TODO: get size...
		Variables.getValue(name, runtime, (value: string) => {
			callback(this.createConcreteType(name, value));
		});
	}


	//**************************************************************************
	public listChildren(
		runtime: Runtime,
		count: number,
		start: number,
		callback: (vars: Array<Variable>) => void
	): void
	{} // Scalars have no children.
}
