import { Variables } from './Variables';
import { Variable } from './Variable';
import { Runtime } from '../Runtime';


export class Scalar extends Variable {
	//**************************************************************************
	private static BASE_TYPE: string = 'scalar';
	private _typename: string = Scalar.BASE_TYPE;


	//**************************************************************************
	constructor(
		name: string = '',
		value: string = '',
		type: string = Scalar.BASE_TYPE,
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
	public extendedTypename(): string { return this.typename(); }


	//**************************************************************************
	public loads(type: string): boolean {
		return type.endsWith(this.typename());
	}


	//**************************************************************************
	public createConcreteType(
		name: string,
		value: string,
		type: string
	): Scalar
	{
		return new Scalar(name, value, type);
	}


	//**************************************************************************
	public loadNew(
		name: string,
		runtime: Runtime,
		callback: (s: Scalar) => void
	): void
	{
		Variables.getType(name, runtime, (type: string) => {
			Variables.getValue(name, runtime, (value: string) => {
				callback(this.createConcreteType(name, value, type));
			});
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
