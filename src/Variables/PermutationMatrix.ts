import { Matrix } from './Matrix';

/*
 * Class that adds support for permutation matrices.
 */
export class PermutationMatrix extends Matrix {
	private static _typename: string = 'permutation matrix';
	private static _typenameRegExp = new RegExp(PermutationMatrix._typename, 'i');

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
		value = value.replace(PermutationMatrix._typenameRegExp, '').trim();
		super(name, value, freeIndices, fixedIndices, validValue);
	}


	//**************************************************************************
	public typename(): string { return PermutationMatrix._typename; }


	//**************************************************************************
	public createConcreteType(
		name: string,
		value: string,
		freeIndices: Array<number>,
		fixedIndices: Array<number>,
		validValue: boolean
	): PermutationMatrix
	{
		return new PermutationMatrix(name, value, freeIndices, fixedIndices, validValue);
	}
}
