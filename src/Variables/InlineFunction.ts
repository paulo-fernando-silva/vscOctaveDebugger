import { Variables } from './Variables';
import { Variable } from './Variable';
import { Runtime } from '../Runtime';


export class InlineFunction extends Variable {
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
	public typename(): string { return 'inline function'; }


	//**************************************************************************
	public loads(type: string): boolean { return type === this.typename(); }


	//**************************************************************************
	public extendedTypename(): string { return this.typename(); }


	//**************************************************************************
	public createConcreteType(
		name: string,
		value: string
	): InlineFunction
	{
		return new InlineFunction(name, value);
	}


	//**************************************************************************
	public loadNew(
		name: string,
		runtime: Runtime,
		callback: (s: InlineFunction) => void
	): void
	{
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
	{} // InlineFunction have no children.
}
