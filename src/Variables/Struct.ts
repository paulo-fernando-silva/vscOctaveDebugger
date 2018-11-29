import * as Constants from '../Constants';
import { Variables } from './Variables';
import { Variable } from './Variable';
import { Runtime } from '../Runtime';


// This is actually an array much like a matrix.
export class Struct extends Variable {
	//**************************************************************************
	private _size: Array<number>;
	private _firstNonOne: number;
	private _extendedTypename: string;


	//**************************************************************************
	constructor(
		name: string = '',
		value: string = '',
		size: Array<number> = []
	)
	{
		super();
		this._name = name;
		this._value = value;
		this._size = size;
		this._firstNonOne = Struct.firstNonOne(size);
		this._numberOfChildren = this._size[this._firstNonOne];
		const dim = size.join(Constants.SIZE_SEPARATOR)
		this._extendedTypename = `${this.typename()} ${dim}`;
	}


	//**************************************************************************
	public load(
		name: string,
		runtime: Runtime,
		callback: (v: Variable) => void
	): void
	{
		Variables.getSize(name, runtime, (size: Array<number>) => {
			// TODO: VSC doesn't seem to support updating parents when children change.
			Variables.getValue(name, runtime, (value: string) => {
				const array = new Struct(name, value, size);
				Variables.addReferenceTo(array);
				callback(array);
			});
		});
	}


	//**************************************************************************
	private static firstNonOne(size: Array<number>) {
		for(let i = 0; i !== size.length; ++i) {
			if(size[i] > 1) {
				return i;
			}
		}

		return size.length;
	}


	//**************************************************************************
	private static childName(
		name: string,
		index: number,
		dimensions: number,
		firstNonOne: number
	) : string
	{
		let prefix = '', suffix = '';

		// Extract any existing indices if any
		const match = name.match(/^(\w+)\(([^:]+,):(.*)\)$/);
		if(match !== null && match.length > 1) {
			name = match[1];
			prefix = match[2];
			suffix = match[3];
		} else { // calculate new indices
			for(let i = 0; i !== firstNonOne; ++i) {
				prefix += '1,'; // Same as prefix = Array(firstNonOne).join('1,')
			}

			for(let i = 1 + firstNonOne; i !== dimensions; ++i) {
				suffix += ',:'; // Same as suffix = Array(dimensions - firstNonOne).join(',:')
			}
		}

		return `${name}(${prefix}${index+1}${suffix})`;
	}


	//**************************************************************************
	public listChildren(
		runtime: Runtime,
		count: number,
		start: number,
		callback: (vars: Array<Variable>) => void
	): void
	{
		const variables = new Array<Variable>();
		const Nmax = this._size[this._firstNonOne];
		const cnt = (count === 0? Nmax : count);
		const end = start + cnt;
		const N = Math.min(end, Nmax);

		for(let i = start; i !== N; ++i) {
			const child = Struct.childName(this.name(), i, this._size.length, this._firstNonOne);

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
	public extendedTypename(): string { return this._extendedTypename; }


	//**************************************************************************
	public loads(type: string): boolean {
		return type === this.typename()
	}
}
