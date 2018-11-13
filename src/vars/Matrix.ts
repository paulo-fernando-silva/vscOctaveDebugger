import { Variable } from './Variable';
import { Variables } from './Variables';
import { Runtime } from '../Runtime';
import { Range } from '../Utils/Range';
import * as Constants from '../Constants';


/*
 * Class that adds support for number based matrices.
 * This doesn't support string or character matrices.
 * 1D matrices are column vectors.
 */
export class Matrix extends Variable {
	//**************************************************************************
	private _basename: string;
	private _fixedIndices: Array<number>;
	private _freeIndices: Array<number>;
	private _children: Array<Variable>;
	private _availableChildrenRange: Array<boolean>;
	private _validValue: boolean;
	private _parsedValue: boolean;


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
		super();
		this._basename = name;
		this._name = Matrix.makeName(name, freeIndices, fixedIndices);
		this._value = value;
		this._freeIndices = freeIndices;
		this._fixedIndices = fixedIndices;
		this._validValue = validValue;

		if(freeIndices.length !== 0) {
			this._numberOfChildren = freeIndices[freeIndices.length - 1];

			if(this._numberOfChildren !== 0) {
				Variables.addReferenceTo(this);
			}
		}
	}


	//**************************************************************************
	public typename(): string { return 'matrix'; }


	//**************************************************************************
	public loads(type: string): boolean {
		return type === this.typename();
	}


	//**************************************************************************
	public static loadable(
		sizes: Array<number>,
		count: number = 0
	): boolean
	{
		const N = sizes.reduce((acc, val) => acc *= val, 1);

		if(count !== 0) {
			return sizes.length <= 1 && N * count <= Variables.getMaximumElementsPrefetch();
		}

		return sizes.length <= 2 && N <= Variables.getMaximumElementsPrefetch();
	}


	//**************************************************************************
	public createConcreteType(
		name: string,
		value: string ,
		freeIndices: Array<number>,
		fixedIndices: Array<number>,
		validValue: boolean
	): Matrix
	{
		return new Matrix(name, value, freeIndices, fixedIndices, validValue);
	}


	//**************************************************************************
	public load(
		name: string,
		runtime: Runtime,
		callback: (v: Variable) => void)
	{
		Variables.getSize(name, runtime, (size: Array<number>) => {
			const loadable = Matrix.loadable(size);

			const buildWith = (value: string) => {
				const matrix = this.createConcreteType(name, value, size, [], loadable);
				callback(matrix);
			};

			if(loadable) {
				Variables.getValue(name, runtime, buildWith);
			} else {
				buildWith(size.join(Constants.SIZE_SEPARATOR));
			}
		});
	}


	//**************************************************************************
	public listChildren(
		runtime: Runtime,
		count: number,
		start: number,
		callback: (vars: Array<Variable>) => void
	): void
	{
		if(this._numberOfChildren === 0) {
			throw "Error: matrix has no children!";
		}

		if(count === 0) {
			count = this._numberOfChildren;
		}

		const range = new Range(start, start+count);
		const self = this;

		this.makeChildrenAvailable(runtime, range, () => {
			if(self._numberOfChildren !== self._children.length) {
				throw `Error: listChildren ${self._numberOfChildren} !== ${self._children.length}!`;
			}

			if(count === self._children.length) {
				callback(self._children);
			} else {
				callback(self._children.slice(start, start+count));
			}
		});
	}


	//**************************************************************************
	public makeChildrenAvailable(
		runtime: Runtime,
		range: Range,
		callback: () => void
	): void
	{
		const self = this;
		if(this._validValue) {
			if(!this._parsedValue) {
				this.parseAllChildren((children: Array<Matrix>) => {
					self._children = children;
					callback();
				})
			} else {
				callback();
			}
		} else {
			const rangesToFetch = this.unavailableOverlappingRanges(range);

			if(rangesToFetch.length !== 0) {
				this.fetchRanges(rangesToFetch, runtime, callback);
			} else {
				callback();
			}
		}
	}


	//**************************************************************************
	public fetchRanges(
		ranges: Array<Range>,
		runtime: Runtime,
		callback: () => void
	): void
	{
		let fetchedRanges = 0;
		const self = this;

		ranges.forEach(range => {
			Matrix.fetchChildrenRange(
				range, runtime, this._basename, this._freeIndices, this._fixedIndices,
				(children: Array<Matrix>) => {
					self.addChildrenFrom(range, children);
					++fetchedRanges;

					if(fetchedRanges === ranges.length) {
						callback();
					}
				})
			}
		);
	}


	//**************************************************************************
	public addChildrenFrom(
		range: Range,
		children: Array<Matrix>
	): void
	{
		if(this._children === undefined) {
			this._children = new Array<Matrix>(this._numberOfChildren);
		}

		for(let i = 0; i !== children.length; ++i) {
			this._children[i + range.min()] = children[i];
		}

		const a = Math.trunc(range.min() / Constants.CHUNKS_SIZE);
		const b = Math.ceil(range.max() / Constants.CHUNKS_SIZE);

		for(let i = a; i !== b; ++i) {
			this._availableChildrenRange[i] = true;
		}
	}


	//**************************************************************************
	public unavailableOverlappingRanges(range: Range): Array<Range> {
		if(this._availableChildrenRange === undefined) {
			const rangeCount = Math.ceil(this._numberOfChildren / Constants.CHUNKS_SIZE);
			this._availableChildrenRange = new Array<boolean>(rangeCount);
		}

		const a = Math.trunc(range.min() / Constants.CHUNKS_SIZE);
		const b = Math.ceil(range.max() / Constants.CHUNKS_SIZE);
		let unavailable = new Array<Range>();

		for(let i = a; i !== b; ++i) {
			if(!this._availableChildrenRange[i]) {
				const min = i * Constants.CHUNKS_SIZE;
				const max = Math.min(min + Constants.CHUNKS_SIZE, this._numberOfChildren);
				const range = new Range(min, max);

				if(unavailable.length !== 0) {
					const last = unavailable[unavailable.length - 1];
					if(last.contigous(range)) {
						last.expandWith(range);
					} else {
						unavailable.push(range);
					}
				} else {
					unavailable.push(range);
				}
			}
		}

		return unavailable;
	}


	//**************************************************************************
	public static parseChildren(
		name: string,
		value: string,
		offset: number,
		count: number,
		freeIndices: Array<number>,
		fixedIndices: Array<number>,
		callback: (vars: Array<Matrix>) => void
	): void
	{
		const N = freeIndices.length;

		switch(N) {
			case 1: Matrix.parseChildrenOf1DMatrix(
				name, value, offset, count, fixedIndices, callback); break;
			case 2: Matrix.parseChildrenOf2DMatrix(
				name, value, offset, count, freeIndices, fixedIndices, callback); break;
			default:
				throw "Parsing of n > 2 dimensional matrices is not supported!";
		}
	}


	//**************************************************************************
	public parseAllChildren(callback: (vars: Array<Matrix>) => void): void {
		const name = this._basename;
		const value = this._value;
		const freeIndices = this._freeIndices;
		const fixedIndices = this._fixedIndices;

		if(freeIndices.length > 2) {
			throw `freeIndices.length: ${freeIndices.length}, expected <= 2!`;
		}

		const count = freeIndices[freeIndices.length - 1];
		const self = this;

		Matrix.parseChildren(name, value, 0, count, freeIndices, fixedIndices,
			(vars: Array<Matrix>) => {
				self._parsedValue = true;
				callback(vars);
			});
	}


	//**************************************************************************
	public static parseChildrenOf1DMatrix(
		name: string,
		value: string,
		offset: number,
		count: number,
		fixedIndices: Array<number>,
		callback: (vars: Array<Matrix>) => void
	): void
	{
		const childFreeIndices = [];
		const vars = new Array<Matrix>(count);
		const vectors = Matrix.extractColumnVectors(value);

		if(vectors.length !== 1) {
			throw `vectors.length: ${vectors.length} != 1!`;
		}

		const vector = vectors[0];

		if(vector.length !== count) {
			throw `vector.length: ${vector.length} != ${count}!`;
		}

		for(let i = 0; i !== count; ++i) {
			const childFixedIndices = [i + offset + 1].concat(fixedIndices);
			vars[i] = new Matrix(name, ''+vector[i], childFreeIndices, childFixedIndices);
		}

		callback(vars);
	}


	//**************************************************************************
	public static parseAllChildrenOf1DMatrix(
		name: string,
		value: string,
		freeIndices: Array<number>,
		fixedIndices: Array<number>,
		callback: (vars: Array<Matrix>) => void
	): void
	{
		if(freeIndices.length !== 1) {
			throw `freeIndices.length: ${freeIndices.length}, expected 1!`;
		}

		Matrix.parseChildrenOf1DMatrix(name, value, 0, freeIndices[0], fixedIndices, callback);
	}


	//**************************************************************************
	public static parseChildrenOf2DMatrix(
		name: string,
		value: string,
		offset: number,
		count: number,
		freeIndices: Array<number>,
		fixedIndices: Array<number>,
		callback: (vars: Array<Matrix>) => void
	): void
	{
		const childFreeIndices = freeIndices.slice(0, freeIndices.length - 1);
		const vars = new Array<Matrix>(count);
		const vectors = Matrix.extractColumnVectors(value);

		if(vectors.length !== count) {
			throw `vectors.length: ${vectors.length} != ${count}!`;
		}

		for(let i = 0; i !== count; ++i) {
			const childFixedIndices = [i + offset + 1].concat(fixedIndices);
			const childValue = vectors[i].join(Constants.COLUMN_ELEMENTS_SEPARATOR);
			vars[i] = new Matrix(name, childValue, childFreeIndices, childFixedIndices);
		}

		callback(vars);
	}


	//**************************************************************************
	public static parseAllChildrenOf2DMatrix(
		name: string,
		value: string,
		freeIndices: Array<number>,
		fixedIndices: Array<number>,
		callback: (vars: Array<Matrix>) => void
	): void
	{
		if(freeIndices.length !== 2) {
			throw `freeIndices.length: ${freeIndices.length}, expected 2!`;
		}

		const N = freeIndices[freeIndices.length - 1];

		Matrix.parseChildrenOf2DMatrix(name, value, 0, N, freeIndices, fixedIndices, callback);
	}


	//**************************************************************************
	public static fetchChildren(
		runtime: Runtime,
		name: string,
		offset: number,
		count: number,
		freeIndices: Array<number>,
		fixedIndices: Array<number>,
		callback: (vars: Array<Matrix>) => void
	): void
	{
		if(freeIndices.length === 0) {
			throw `fetchChildren::freeIndices.length: ${freeIndices.length} === 0`;
		}

		const childrenFreeIndices = freeIndices.slice(0, freeIndices.length - 1);
		const loadable = Matrix.loadable(childrenFreeIndices, count);

		if(loadable) {
			const rangeName = Matrix.makeRangedName(
				name, freeIndices, fixedIndices, offset, count);
			Variables.getValue(rangeName, runtime, (value: string) => {
				Matrix.parseChildren(
					name, value, offset, count, freeIndices, fixedIndices, callback)
			});
		} else {
			const value = childrenFreeIndices.join(Constants.SIZE_SEPARATOR);
			const vars = new Array<Matrix>(count);
			for(let i = 0; i !== count; ++i) {
				const childrenFixedIndices = [offset + i + 1].concat(fixedIndices);
				vars[i] = new Matrix(
					name, value, childrenFreeIndices, childrenFixedIndices, false);
			}
			callback(vars);
		}
	}


	//**************************************************************************
	public static fetchAllChildren(
		runtime: Runtime,
		name: string,
		freeIndices: Array<number>,
		fixedIndices: Array<number>,
		callback: (vars: Array<Matrix>) => void
	): void
	{
		const Nchildren = freeIndices[freeIndices.length - 1]; // #children
		Matrix.fetchChildren(runtime, name, 0, Nchildren, freeIndices, fixedIndices, callback);
	}


	//**************************************************************************
	public static fetchChildrenRange(
		range: Range,
		runtime: Runtime,
		name: string,
		freeIndices: Array<number>,
		fixedIndices: Array<number>,
		callback: (vars: Array<Matrix>) => void
	): void
	{
		const offset = range.min();
		const count = range.size();
		Matrix.fetchChildren(runtime, name, offset, count, freeIndices, fixedIndices, callback);
	}


	//**************************************************************************
	public static makeName(
		name: string,
		freeIndices: Array<number>,
		fixedIndices: Array<number>
	): string
	{
		let freeIndicesStr = '', fixedIndicesStr = '';

		if(fixedIndices.length !== 0) {
			fixedIndicesStr = fixedIndices.join(',');
		} else {
			return name;
		}

		if(freeIndices.length !== 0) {
			freeIndicesStr = ':,'.repeat(freeIndices.length);
		}

		return `${name}(${freeIndicesStr}${fixedIndicesStr})`;
	}


	//**************************************************************************
	public static makeRangedName(
		name: string,
		freeIndices: Array<number>,
		fixedIndices: Array<number>,
		offset: number,
		count: number
	): string
	{
		let freeIndicesStr = '', fixedIndicesStr = '';

		if(fixedIndices.length !== 0) {
			fixedIndicesStr = ',' + fixedIndices.join(',');
		}

		if(freeIndices.length !== 0) {
			freeIndicesStr = ':,'.repeat(freeIndices.length - 1);
			const a = offset + 1;		// Indices are 1-based
			const b = offset + count;	// Last index is inclusive
			freeIndicesStr += `${a}:${b}`;
		}

		return `${name}(${freeIndicesStr}${fixedIndicesStr})`;
	}


	//**************************************************************************
	public static extractValuesLines(value: string): Array<string> {
		const inLines = value.trim().split('\n').filter(line => line.length !== 0);
		const N = inLines.length;
		const regex = /Columns \d+ through \d+:/;
		let outLines = new Array<string>();
		let multiColumnGroup = false;

		for(let i = 0; i !== N;) {
			if(inLines[i].match(regex) !== null) {
				if(!multiColumnGroup) {
					multiColumnGroup = true;
					++i; // skip line

					while(i !== N && inLines[i].match(regex) === null) {
						outLines.push(inLines[i++].trim());
					}
				} else {
					++i; // skip line
					let j = 0;
					while(i !== N && inLines[i].match(regex) === null) {
						outLines[j++] += Constants.ROW_ELEMENTS_SEPARATOR + inLines[i++].trim();
					}
				}
			} else {
				outLines.push(inLines[i++]);
			}
		}

		return outLines;
	}


	//**************************************************************************
	public static extractValuesLine(value: string): string {
		const lines = Matrix.extractValuesLines(value);
		return lines.join(Constants.ROW_ELEMENTS_SEPARATOR).trim();
	}


	//**************************************************************************
	public static extractColumnVectors(value: string): Array<Array<string>> {
		const lines = Matrix.extractValuesLines(value);
		const Nrows = lines.length;

		if(Nrows === 0) {
			return [];
		}

		let row = 0;
		let rowValues = lines[row].trim().split(Constants.ROW_ELEMENTS_SEPARATOR_REGEX);
		const Ncols = rowValues.length;
		const vectors = new Array<Array<string>>(Ncols);

		for(let col = 0; col !== Ncols; ++col) {
			vectors[col] = new Array<string>(Nrows);
			vectors[col][row] = rowValues[col];
		}

		for(row = 1; row !== Nrows; ++row) {
			rowValues = lines[row].trim().split(Constants.ROW_ELEMENTS_SEPARATOR_REGEX);

			if(rowValues.length !== Ncols) {
				throw `rowValues.length !== Ncols: ${rowValues.length} !== ${Ncols}`;
			}

			for(let col = 0; col !== Ncols; ++col) {
				vectors[col][row] = rowValues[col];
			}
		}

		return vectors;
	}
}
