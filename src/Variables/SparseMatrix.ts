import { Matrix } from './Matrix';
import { Variables } from './Variables';
import { Runtime } from '../Runtime';
import * as Constants from '../Constants';

/*
 * Class that adds support for sparse matrix type.
 */
export class SparseMatrix extends Matrix {
	private _indices: Array<number>;

	/***************************************************************************
	 * @param name the variable name without indices.
	 * @param value the contents of the variable.
	 * @param freeIndices the number of elements in each dimension.
	 * @param fixedIndices if this is a part of a larger matrix, the right-most
	 * indices that are used to access this submatrix (one based).
	 * @param validValue actually the variable content and not a placeholder?
	 **************************************************************************/
	constructor(
		name: string = '',
		value: string = '',
		freeIndices: Array<number> = [],
		fixedIndices: Array<number> = [],
		validValue: boolean = true
	)
	{
		super(name, value, freeIndices, fixedIndices, validValue);
		this._indices = new Array<number>(this._numberOfChildren);
	}


	//**************************************************************************
	public typename(): string { return 'sparse matrix'; }


	//**************************************************************************
	public indices(): Array<number> { return this._indices; }


	//**************************************************************************
	public createConcreteType(
		name: string,
		value: string,
		freeIndices: Array<number>,
		fixedIndices: Array<number>,
		validValue: boolean
	): SparseMatrix
	{
		return new SparseMatrix(name, value, freeIndices, fixedIndices, validValue);
	}


	//**************************************************************************
	public loadNew(
		name: string,
		runtime: Runtime,
		callback: (sm: SparseMatrix) => void)
	{
		Variables.getNonZero(name, runtime, (n: number) => {
			const size = [n];
			const loadable = Matrix.loadable(size);

			const buildWith = (value: string) => {
				const matrix = this.createConcreteType(name, value, size, [], loadable);
				if(loadable) {
					matrix.fetchIndices(runtime, 0, 0, () => { callback(matrix); });
				} else {
					callback(matrix);
				}
			};

			if(loadable) {
				Variables.getValue(name, runtime, buildWith);
			} else {
				buildWith(size.join(Constants.SIZE_SEPARATOR));
			}
		});
	}


	//**************************************************************************
	public fetchChildren(
		runtime: Runtime,
		offset: number,
		count: number,
		callback: (vars: Array<SparseMatrix>) => void
	): void
	{
		this.fetchIndices(runtime, offset, count, (fetchedIndices: Array<number>) => {
			const begin = 1 + offset;
			const end = begin + count - 1;
			// matlab indices start at 1
			const exp = `${this.name()}(find(${this.name()})(${begin}:${end}))`;
			runtime.evaluate(exp, (value: string) => {
				this.parseChildren(value, offset, count, (children: Array<SparseMatrix>) => {
					callback(children);
				});
			});
		});
	}


	//**************************************************************************
	public fetchIndices(
		runtime: Runtime,
		offset: number,
		count: number,
		callback: (fetchedIndices: Array<number>) => void
	): void
	{
		if(count === 0 && count === 0) {
			count = this._numberOfChildren;
		}

		// matlab indices start at 1
		const begin = 1 + offset;
		const end = begin + count - 1;
		const idxExp = `find(${this.name()})(${begin}:${end})`;
		runtime.evaluate(idxExp, (value: string) => {
			const values = Variables.clean(value).split('\n').filter((val) => val);
			const indices = values.map(i => parseInt(i));

			for(let i = 0; i !== indices.length; ++i) {
				this._indices[offset + i] = indices[i];
			}

			callback(indices);
		});
	}


	//**************************************************************************
	public parseChildren(
		value: string,
		offset: number,
		count: number,
		callback: (vars: Array<SparseMatrix>) => void
	): void
	{
		const childFreeIndices = [];
		const vars = new Array<SparseMatrix>(count);
		const values = SparseMatrix.extractValues(value);

		if(values.length !== count) {
			throw `values.length: ${values.length} != ${count}!`;
		}

		for(let i = 0; i !== count; ++i) {
			const childFixedIndices = [this._indices[i + offset]];
			const name = this.basename();
			const val = ''+values[i];
			vars[i] = new SparseMatrix(name, val, childFreeIndices, childFixedIndices);
		}

		callback(vars);
	}


	//**************************************************************************
	// Compressed Column Sparse (rows = 3, cols = 1, nnz = 3 [100%])
	//
	//   (1, 1) -> -10.200
	//   (2, 1) ->  5
	//   (3, 1) ->  101
	//
	public static extractValues(value: string): Array<string> {
		const lines = value.split('\n');
		const values = new Array<string>();

		lines.forEach(line => {
			const match = line.match(/^\s*\(\d+,\s+\d+\)\s+->\s+(.+)$/);
			if(match !== null && match.length === 2) {
				const value = match[1];
				values.push(value);
			}
		});

		return values;
	}
}
