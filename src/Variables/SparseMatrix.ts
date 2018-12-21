import { Matrix } from './Matrix';
import { Variable } from './Variable';
import { Variables } from './Variables';
import { Runtime } from '../Runtime';
import * as Constants from '../Constants';

/*
 * Class that adds support for sparse matrix type.
 */
export class SparseMatrix extends Matrix {
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
	}


	//**************************************************************************
	public typename(): string { return 'sparse matrix'; }


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
	public listChildren(
		runtime: Runtime,
		count: number,
		start: number,
		callback: (vars: Array<Variable>) => void
	): void
	{
		// TODO: sparse matrix listChildren
	}
}
