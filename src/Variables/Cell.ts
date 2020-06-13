import { CommandInterface } from '../Commands';
import * as Constants from '../Constants';
import { Variables } from './Variables';
import { Variable } from './Variable';
import { Matrix } from './Matrix';


// Cell: another array type.
export class Cell extends Matrix {
	//**************************************************************************
	private static CELL_TYPENAME: string = 'cell';


	/***************************************************************************
	 * @param name the variable name without indices.
	 * @param value the contents of the variable.
	 * @param freeIndices the number of elements in each dimension.
	 * @param fixedIndices if this is a part of a larger matrix, the right-most
	 * indices that are used to access this submatrix (one based).
	 **************************************************************************/
	constructor(
		name: string = '',
		value: string = '',
		freeIndices: Array<number> = [],
		fixedIndices: Array<number> = []
	)
	{
		super(name, value, freeIndices, fixedIndices, false, Cell.CELL_TYPENAME);
	}


	//**************************************************************************
	public typename(): string { return Cell.CELL_TYPENAME; }


	//**************************************************************************
	public loads(type: string): boolean { return type === this.typename(); }


	//**************************************************************************
	public createConcreteType(
		name: string,
		value: string,
		freeIndices: Array<number>,
		fixedIndices: Array<number>,
		validValue: boolean,
		type: string
	): Cell
	{
		return new Cell(name, value, freeIndices, fixedIndices);
	}


	//**************************************************************************
	public loadNew(
		name: string,
		type: string,
		runtime: CommandInterface,
		callback: (s: Cell) => void
	): void
	{
		Variables.getSize(name, runtime, (size: Array<number>) => {
			const value = size.join(Constants.SIZE_SEPARATOR);
			const cell = this.createConcreteType(name, value, size, [], false, type);
			callback(cell);
		});
	}


	//**************************************************************************
	public loacChild(
		runtime: CommandInterface,
		freeIndices: Array<number>,
		fixedIndices: Array<number>,
		callback: (v: Variable) => void
	): void
	{
		if(freeIndices.length === 0) {
			// if there are no free indices then the variable is a cell
			const name = this.makeName(this.basename(), freeIndices, fixedIndices, Constants.CELL_LEFT, Constants.CELL_RIGHT);
			Variables.loadVariable(name, runtime, callback);
		} else {
			// whem we have a free indices, the variable is still a cell
			const cell = this.createConcreteType(this.basename(), '', freeIndices, fixedIndices, false, Cell.CELL_TYPENAME);
			callback(cell);
		}
	}


	//**************************************************************************
	public loadChildrenRange(
		runtime: CommandInterface,
		offset: number,
		count: number,
		callback: (vars: Array<Variable>) => void
	): void
	{
		const vars = new Array<Variable>();
		const freeIndices = this.freeIndices();
		const fixedIndices = this.fixedIndices();
		const childrenFreeIndices = freeIndices.slice(0, freeIndices.length - 1);

		for(let i = 0; i !== count; ++i) {
			const childFixedIndices = [i + offset + 1].concat(fixedIndices);

			this.loacChild(runtime, childrenFreeIndices, childFixedIndices, (v: Variable) => {
				vars.push(v);

				if(vars.length === count) {
					callback(vars);
				}
			});
		}
	}
}
