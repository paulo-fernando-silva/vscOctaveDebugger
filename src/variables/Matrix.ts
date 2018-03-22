import { Variables } from './Variables';
import { Variable } from './Variable';
import { Runtime } from '../Runtime';


export class Matrix extends Variable {
	//**************************************************************************
	private _size: Array<number>;
	private _firstNonOne: number;


	//**************************************************************************
	constructor(name: string = '',
				value: string = '',
				size: Array<number> = [])
	{
		super();
		this._name = name;
		this._value = value;
		this._size = size;
		this._firstNonOne = Matrix.firstNonOne(size);
		this._indexedVariables = this._size[this._firstNonOne];
	}


	//**************************************************************************
	public typename(): string { return 'matrix'; }


	//**************************************************************************
	public loads(type: string): boolean {
		return type === this.typename()
			|| type === 'struct'; // Struct only types are actually arrays.
	}


	//**************************************************************************
	public load(name: string,
				runtime: Runtime,
				callback: (v: Variable) => void)
	{
		Variables.getSize(name, runtime, (size: Array<number>) => {
			// TODO: VSC doesn't seem to support updating parents when children change.
			// So, we skip showing the child value in parent value.
			// TODO: avoid displaying the contents of very large matrices.

			Variables.getValue(name, runtime, (value: string) => {
				// const value = size.join('x');
				const matrix = new Matrix(name, value, size);
				// Matrices are registered as they have children.
				Variables.addReferenceTo(matrix);
				callback(matrix);
			});
		});
	}


	//**************************************************************************
	public listChildren(runtime: Runtime,
						callback: (vars: Array<Variable>) => void)
	{
		const variables = new Array<Variable>();
		const N = this._size[this._firstNonOne];

		for(var i = 0; i != N; ++i) {
			const child = this.childName(this.name(), i, this._size.length, this._firstNonOne);

			Variables.loadVariable(child, runtime, (v: Variable) => {
				variables.push(v);

				if(variables.length === N)
					callback(variables);
			});
		}
	}


	//**************************************************************************
	private static firstNonOne(size: Array<number>) {
		for(var i = 0; i != size.length; ++i)
			if(size[i] > 1) {
				return i;
			}

		return size.length;
	}


	//**************************************************************************
	private childName(	name: string,
						index: number,
						dimensions: number,
						firstNonOne: number) : string
	{
		var prefix = '', suffix = '';

		// Extract any existing indices if any
		const match = name.match(/^(\w+)\(([^:]+,):(.*)\)$/);
		if(match !== null && match.length > 1) {
			name = match[1];
			prefix = match[2];
			suffix = match[3];
		} else { // calculate new indices
			for(var i = 0; i != firstNonOne; ++i)
				prefix += '1,'; // Same as prefix = Array(firstNonOne).join('1,'

			for(var i = 1 + firstNonOne; i != dimensions; ++i)
				suffix += ',:'; // Same as suffix = Array(dimensions - firstNonOne).join(',:')
		}

		return `${name}(${prefix}${index+1}${suffix})`;
	}
}
