import { Matrix } from './Matrix';

/*
 * Class that adds support for range type, which is basically a vector/matrix.
 */
export class Range extends Matrix {
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
	public typename(): string { return 'range'; }


	//**************************************************************************
	public createConcreteType(
		name: string,
		value: string,
		freeIndices: Array<number>,
		fixedIndices: Array<number>,
		validValue: boolean
	): Range
	{
		return new Range(name, value, freeIndices, fixedIndices, validValue);
	}
}
