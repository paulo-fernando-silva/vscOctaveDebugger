import { Variables } from './Variables';
import { Variable } from './Variable';
import { AbstractArray } from './AbstractArray';
import { Runtime } from '../Runtime';


// This is actually an array much like a matrix.
export class Struct extends AbstractArray {
	//**************************************************************************
	protected _size: Array<number>;
	protected _firstNonOne: number;


	//**************************************************************************
	constructor(name: string = '',
				value: string = '',
				size: Array<number> = [])
	{
		super();
		this._name = name;
		this._value = value;
		this._size = size;
		this._firstNonOne = AbstractArray.firstNonOne(size);
		this._numberOfChildren = this._size[this._firstNonOne];
	}


	//**************************************************************************
	protected makeConcreteType(
		name: string,
		value: string,
		size: Array<number>
	): AbstractArray
	{
		return new Struct(name, value, size);
	}


	//**************************************************************************
	public listChildren(runtime: Runtime,
		count: number,
		start: number,
		callback: (vars: Array<Variable>) => void)
	{
		const variables = new Array<Variable>();
		const Nmax = this._size[this._firstNonOne];
		const cnt = (count === 0? Nmax : count);
		const end = start + cnt;
		const N = Math.min(end, Nmax);

		for(let i = start; i !== N; ++i) {
			const child = AbstractArray.childName(this.name(), i, this._size.length, this._firstNonOne);

			Variables.loadVariable(child, runtime, (v: Variable) => {
				variables.push(v);

				if(variables.length === cnt) {
					callback(variables);
				}
			});
		}
	}


	//**************************************************************************
	public typename(): string { return 'struct'; }


	//**************************************************************************
	public loads(type: string): boolean {
		return type === this.typename()
	}
}
