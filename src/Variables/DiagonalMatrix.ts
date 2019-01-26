import { Matrix } from './Matrix';

/*
 * Class that adds support for diagonal matrices.
 */
export class DiagonalMatrix extends Matrix {
	private static _typename: string = 'diagonal matrix';
	private static _typenameRegExp = new RegExp(DiagonalMatrix._typename, 'i');

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
		value = value.replace(DiagonalMatrix._typenameRegExp, '').trim();
		super(name, value, freeIndices, fixedIndices, validValue);
	}


	//**************************************************************************
	public typename(): string { return DiagonalMatrix._typename; }


	//**************************************************************************
	public createConcreteType(
		name: string,
		value: string,
		freeIndices: Array<number>,
		fixedIndices: Array<number>,
		validValue: boolean
	): DiagonalMatrix
	{
		return new DiagonalMatrix(name, value, freeIndices, fixedIndices, validValue);
	}
}
