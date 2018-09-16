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
		this._numberOfChildren = this._size[this._firstNonOne];
	}


	//**************************************************************************
	public typename(): string { return 'matrix'; }


	//**************************************************************************
	public loads(type: string): boolean {
		return type === this.typename();
	}


	//**************************************************************************
	private static buildMatrix(
		name: string,
		runtime: Runtime,
		sizeProduct: number,
		size: Array<number>,
		callback: (v: Variable) => void
	)
	{
		// TODO: VSC doesn't seem to support updating parents when children change.
		// So, we skip showing the child value in parent value.
		const buildCallback = (value: string,) => {
			const matrix = new Matrix(name, value, size);
			Variables.addReferenceTo(matrix);
			callback(matrix);
		};

		if(sizeProduct <= Variables.getPrefetch()) {
			Variables.getValue(name, runtime, (value: string) => {
				buildCallback(value);
			});
		} else {
			const value = size.join('x');
			buildCallback(value);
		}
	}


	//**************************************************************************
	public load(name: string,
				runtime: Runtime,
				callback: (v: Variable) => void)
	{
		Variables.getSize(name, runtime, (size: Array<number>) => {
			const sizeProduct = Matrix.product(size);
			Matrix.buildMatrix(name, runtime, sizeProduct, size, callback);
		});
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
		const prefix = (this._firstNonOne === 0? [] : this._size.slice(0, this._firstNonOne));
		const suffix = this._size.slice(this._firstNonOne + 1);
		const childSize = prefix.concat([1]).concat(suffix);
		const sizeProduct = Matrix.product(suffix);
		const childrenAreMatrices = sizeProduct > 1;

		const loadCallback = (!childrenAreMatrices? Variables.loadVariable :
			(n: string, r: Runtime, cb: (v: Variable) => void) => {
				Matrix.buildMatrix(n, r, sizeProduct, childSize, cb);
			}
		);

		for(let i = start; i !== N; ++i) {
			const child = this.childName(this.name(), i, this._size.length, this._firstNonOne);
			loadCallback(child, runtime, (v: Variable) => {
				variables.push(v);

				if(variables.length === cnt) {
					callback(variables);
				}
			});
		}
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
	private childName(	name: string,
						index: number,
						dimensions: number,
						firstNonOne: number) : string
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
				prefix += '1,'; // Same as prefix = Array(firstNonOne).join('1,'
			}

			for(let i = 1 + firstNonOne; i !== dimensions; ++i) {
				suffix += ',:'; // Same as suffix = Array(dimensions - firstNonOne).join(',:')
			}
		}

		return `${name}(${prefix}${index+1}${suffix})`;
	}


	//**************************************************************************
	private static product(vec: Array<number>): number {
		if(vec.length === 0) {
			return 0;
		}

		let val = vec[0];

		for(let i = 1; i !== vec.length; ++i) {
			val *= vec[i];
		}

		return val;
	}
}
