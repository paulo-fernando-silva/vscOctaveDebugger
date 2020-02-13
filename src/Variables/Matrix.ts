import { Variable } from './Variable';
import { Variables } from './Variables';
import * as Constants from '../Constants';
import { Interval } from '../Utils/Interval';
import { CommandInterface } from '../Runtime';


/*
 * Class that adds support for number based matrices.
 * This doesn't support string or character matrices.
 * 1D matrices are column vectors.
 */
export class Matrix extends Variable {
	//**************************************************************************
	private static MATRIX_TYPENAME: string = 'matrix';
	// _typename caches type passed to the constructor, and is returned by typename()
	// However, for certain types this might differ from the overriden typename.
	// This is because mainly because in octave typesnames might come in two formats.
	// e.g. "complex diagonal matrix" uses "diagonal matrix" in certain places...
	// typename used by octave when printing the value
	private _typename: string; // typename used by octave when printing the value
	private _basename: string; // name of the variable without indices
	private _fixedIndices: Array<number>; // subvariable indices
	private _freeIndices: Array<number>; // children indices
	private _children: Array<Variable>; // the childen parsed so far
	private _availableChildrenRange: Array<boolean>; // children parsed?
	private _validValue: boolean; // is the value parsable?
	private _parsedValue: boolean; // has the value been parsed?
	private _extendedTypename: string; // used for displaying when value is not valid.
	private _typeRegex: RegExp; // used to clean the value from pesky _typenames


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
		validValue: boolean = true,
		type: string = Matrix.MATRIX_TYPENAME,
	)
	{
		super();
		// These need to be set before anything else is set.
		this._typeRegex = new RegExp(type, 'i')
		this._basename = name;
		this._typename = type;
		// These perform a more complex setting with some bookkeeping
		this.setIndices(freeIndices, fixedIndices);
		this.setValue(value, validValue);
	}


	//**************************************************************************
	public static cleanComplex(value: string): string {
		return value.replace(/(?:\s+([\+\-])\s+)/g, "$1");
	}


	//**************************************************************************
	public setIndices(free: Array<number>, fixed: Array<number>): void {
		this._freeIndices = free;
		this._fixedIndices = fixed;

		this._name = this.makeName(this._basename, this._freeIndices, this._fixedIndices);

		if(this._freeIndices.length !== 0) {
			this._numberOfChildren = this._freeIndices[this._freeIndices.length - 1];

			if(this._numberOfChildren !== 0) {
				Variables.addReferenceTo(this);
			}

			const size = this._freeIndices.join(Constants.SIZE_SEPARATOR)
			this._extendedTypename = `${this.typename()} ${size}`;
		}
	}


	//**************************************************************************
	public setValue(val: string, isValid: boolean): void {
		this._validValue = isValid;

		if(isValid) {
			// "this cleanup is done really just for displaying."
			val = val.replace(this._typeRegex, '').replace(/\n\s+/g, '\n').trim();

			if(this.isComplex()) {
				val = Matrix.cleanComplex(val);
			}
		}

		this._value = val;
	}


	//**************************************************************************
	public basename(): string { return this._basename; }


	//**************************************************************************
	public typename(): string { return this._typename; }


	//**************************************************************************
	public extendedTypename(): string { return this._extendedTypename; }


	//**************************************************************************
	public fixedIndices(): Array<number> { return this._fixedIndices; }


	//**************************************************************************
	public freeIndices(): Array<number> { return this._freeIndices; }


	//**************************************************************************
	public loads(type: string): boolean {
		return type.endsWith(this.typename());
	}


	//**************************************************************************
	public isComplex(): boolean {
		// TODO: typename() can be different from _typename
		return this.typename().includes("complex");
	}


	//**************************************************************************
	public createConcreteType(
		name: string,
		value: string,
		freeIndices: Array<number>,
		fixedIndices: Array<number>,
		validValue: boolean,
		type: string
	): Matrix
	{
		return new Matrix(name, value, freeIndices, fixedIndices, validValue, type);
	}


	//**************************************************************************
	public createChildType(
		value: string,
		freeIndices: Array<number>,
		fixedIndices: Array<number>,
		validValue: boolean
	): Variable
	{
		return new Matrix(this.basename(), value, freeIndices, fixedIndices, validValue, this.typename());
	}


	//**************************************************************************
	public loadNew(
		name: string,
		type: string,
		runtime: CommandInterface,
		callback: (m: Matrix) => void)
	{
		Variables.getSize(name, runtime, (size: Array<number>) => {
			const loadable = Variables.loadable(size);

			const buildWith = (value: string) => {
				const matrix = this.createConcreteType(name, value, size, [], loadable, type);
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
		runtime: CommandInterface,
		count: number,
		start: number,
		callback: (vars: Array<Variable>) => void
	): void
	{
		if(this._numberOfChildren === 0) {
			throw "Error: matrix has no children!";
		}

		if(count === 0 && start === 0) {
			count = this._numberOfChildren;
		}

		const interval = new Interval(start, start+count);
		const self = this;

		this.makeChildrenAvailable(runtime, interval, () => {
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
		runtime: CommandInterface,
		interval: Interval,
		callback: () => void
	): void
	{
		const self = this;
		if(this._validValue) {
			if(!this._parsedValue) {
				this.parseAllChildren((children: Array<Variable>) => {
					self._children = children;
					callback();
				});
			} else {
				callback();
			}
		} else {
			const rangesToFetch = this.unavailableOverlappingRanges(interval);

			if(rangesToFetch.length !== 0) {
				this.fetchRanges(rangesToFetch, runtime, callback);
			} else {
				callback();
			}
		}
	}


	//**************************************************************************
	public fetchRanges(
		ranges: Array<Interval>,
		runtime: CommandInterface,
		callback: () => void
	): void
	{
		let fetchedRanges = 0;
		const self = this;

		ranges.forEach(interval => {
			this.fetchChildrenRange(interval, runtime, (children: Array<Variable>) => {
				self.addChildrenFrom(interval, children);
				++fetchedRanges;

				if(fetchedRanges === ranges.length) {
					callback();
				}
			})
		});
	}


	//**************************************************************************
	public addChildrenFrom(
		interval: Interval,
		children: Array<Variable>
	): void
	{
		if(this._children === undefined) {
			this._children = new Array<Variable>(this._numberOfChildren);
		}

		if(this._children.length < interval.min() + children.length) {
			throw `Matrix::addChildrenFrom dst ${this._children.length} < src ${interval.min()} + ${children.length}`;
		}

		for(let i = 0; i !== children.length; ++i) {
			this._children[i + interval.min()] = children[i];
		}

		const a = Math.trunc(interval.min() / Constants.CHUNKS_SIZE);
		const b = Math.ceil(interval.max() / Constants.CHUNKS_SIZE);

		for(let i = a; i !== b; ++i) {
			this._availableChildrenRange[i] = true;
		}
	}


	//**************************************************************************
	public unavailableOverlappingRanges(interval: Interval): Array<Interval> {
		if(this._availableChildrenRange === undefined) {
			const rangeCount = Math.ceil(this._numberOfChildren / Constants.CHUNKS_SIZE);
			this._availableChildrenRange = new Array<boolean>(rangeCount);
		}

		const a = Math.trunc(interval.min() / Constants.CHUNKS_SIZE);
		const b = Math.ceil(interval.max() / Constants.CHUNKS_SIZE);
		let unavailable = new Array<Interval>();

		for(let i = a; i !== b; ++i) {
			if(!this._availableChildrenRange[i]) {
				const min = i * Constants.CHUNKS_SIZE;
				const max = Math.min(min + Constants.CHUNKS_SIZE, this._numberOfChildren);
				const interval = new Interval(min, max);

				if(unavailable.length !== 0) {
					const last = unavailable[unavailable.length - 1];
					if(last.contigous(interval)) {
						last.expandWith(interval);
					} else {
						unavailable.push(interval);
					}
				} else {
					unavailable.push(interval);
				}
			}
		}

		return unavailable;
	}


	//**************************************************************************
	public fetchChildrenRange(
		interval: Interval,
		runtime: CommandInterface,
		callback: (vars: Array<Variable>) => void
	): void
	{
		const offset = interval.min();
		const count = interval.size();
		this.fetchChildren(runtime, offset, count, callback);
	}


	//**************************************************************************
	public parseChildren(
		value: string,
		offset: number,
		count: number,
		callback: (vars: Array<Variable>) => void
	): void
	{
		const N = this._freeIndices.length;

		switch(N) {
			case 1: this.parseChildrenOf1DMatrix(value, offset, count, callback); break;
			case 2: this.parseChildrenOf2DMatrix(value, offset, count, callback); break;
			default: throw "Parsing of n > 2 dimensional matrices is not supported!";
		}
	}


	//**************************************************************************
	public parseAllChildren(callback: (vars: Array<Variable>) => void): void {
		const value = this._value;

		if(this._freeIndices.length > 2) {
			throw `freeIndices.length: ${this._freeIndices.length}, expected <= 2!`;
		}

		const count = this._freeIndices[this._freeIndices.length - 1];
		const self = this;

		this.parseChildren(value, 0, count, (vars: Array<Variable>) => {
			self._parsedValue = true;
			callback(vars);
		});
	}


	//**************************************************************************
	public parseChildrenOf1DMatrix(
		value: string,
		offset: number,
		count: number,
		callback: (vars: Array<Variable>) => void
	): void
	{
		const childFreeIndices = [];
		const vars = new Array<Variable>(count);
		const vectors = Matrix.extractArrayElements(value, this.isComplex());

		if(vectors.length !== 1) {
			throw `vectors.length: ${vectors.length} != 1!`;
		}

		const vector = vectors[0];

		if(vector.length !== count) {
			throw `vector.length: ${vector.length} != ${count}!`;
		}

		for(let i = 0; i !== count; ++i) {
			const childFixedIndices = [i + offset + 1].concat(this._fixedIndices);
			vars[i] = this.createChildType(''+vector[i], childFreeIndices, childFixedIndices, true);
		}

		callback(vars);
	}


	//**************************************************************************
	public parseAllChildrenOf1DMatrix(
		value: string,
		callback: (vars: Array<Variable>) => void
	): void
	{
		if(this._freeIndices.length !== 1) {
			throw `freeIndices.length: ${this._freeIndices.length}, expected 1!`;
		}

		this.parseChildrenOf1DMatrix(value, 0, this._freeIndices[0], callback);
	}


	//**************************************************************************
	public parseChildrenOf2DMatrix(
		value: string,
		offset: number,
		count: number,
		callback: (vars: Array<Variable>) => void
	): void
	{
		const childFreeIndices = this._freeIndices.slice(0, this._freeIndices.length - 1);
		const vars = new Array<Variable>(count);
		const vectors = Matrix.extractArrayElements(value, this.isComplex());

		if(vectors.length !== count) {
			throw `vectors.length: ${vectors.length} != ${count}!`;
		}

		for(let i = 0; i !== count; ++i) {
			const childFixedIndices = [i + offset + 1].concat(this._fixedIndices);
			const childValue = vectors[i].join(Constants.COLUMN_ELEMENTS_SEPARATOR);
			vars[i] = this.createChildType(childValue, childFreeIndices, childFixedIndices, true);
		}

		callback(vars);
	}


	//**************************************************************************
	public parseAllChildrenOf2DMatrix(
		value: string,
		callback: (vars: Array<Variable>) => void
	): void
	{
		if(this._freeIndices.length !== 2) {
			throw `freeIndices.length: ${this._freeIndices.length}, expected 2!`;
		}

		const N = this._freeIndices[this._freeIndices.length - 1];

		this.parseChildrenOf2DMatrix(value, 0, N, callback);
	}


	//**************************************************************************
	public fetchChildren(
		runtime: CommandInterface,
		offset: number,
		count: number,
		callback: (vars: Array<Variable>) => void
	): void
	{
		if(this._freeIndices.length === 0) {
			throw `fetchChildren::freeIndices.length: ${this._freeIndices.length} === 0`;
		}

		const childrenFreeIndices = this._freeIndices.slice(0, this._freeIndices.length - 1);
		const loadable = Variables.loadable(childrenFreeIndices, count);

		if(loadable) {
			this.loadChildrenRange(runtime, offset, count, callback);
		} else {
			const value = childrenFreeIndices.join(Constants.SIZE_SEPARATOR);
			const vars = new Array<Variable>(count);
			for(let i = 0; i !== count; ++i) {
				const childrenFixedIndices = [offset + i + 1].concat(this._fixedIndices);
				vars[i] = this.createChildType(value, childrenFreeIndices, childrenFixedIndices, false);
			}
			callback(vars);
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
		const rangeName = this.makeRangeName(offset, count);
		Variables.getValue(rangeName, runtime, (value: string) => {
			// The "value" is not cached, as there might be ranges that aren't loaded.
			// We still need to potentially remove the typename from certain types.
			value = value.replace(this._typeRegex, '').trim();
			this.parseChildren(value, offset, count, callback);
		});
	}


	//**************************************************************************
	public fetchAllChildren(
		runtime: CommandInterface,
		callback: (vars: Array<Variable>) => void
	): void
	{
		const Nchildren = this._freeIndices[this._freeIndices.length - 1]; // #children
		this.fetchChildren(runtime, 0, Nchildren, callback);
	}


	//**************************************************************************
	public makeName(
		name: string,
		freeIndices: Array<number>,
		fixedIndices: Array<number>,
		left: string = Constants.DEFAULT_LEFT,
		right: string = Constants.DEFAULT_RIGHT
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

		return `${name}${left}${freeIndicesStr}${fixedIndicesStr}${right}`;
	}


	//**************************************************************************
	public makeRangeName(
		offset: number,
		count: number
	): string
	{
		const name: string = this._basename;
		const freeIndices: Array<number> = this._freeIndices;
		const fixedIndices: Array<number> = this._fixedIndices;

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
	// Splits "123 456 789 0" or "123 + 456i 789 + 0i" into its elements
	// i.e. ["123", "456", "789", "0"] and ["123+456i", "789+0i"] respectively
	public static split(value: string, isComplex: boolean): Array<string> {
		value = value.trim();
		if(isComplex) {
			// Remove spaces in complex numbers
			value = Matrix.cleanComplex(value);
		}
		// split by spaces, and remove non-empty elements
		const elements = value.split(' ').filter(line => line);
		return elements;
	}


	//**************************************************************************
	public static transpose(matrix: Array<Array<string>>): Array<Array<string>> {
		const N_rows = matrix.length;
		let rowValues = matrix[0];
		const N_cols = rowValues.length;
		const transposed = new Array<Array<string>>(N_cols);

		for(let col = 0; col !== N_cols; ++col) {
			transposed[col] = new Array<string>(N_rows);
			transposed[col][0] = rowValues[col];
		}

		for(let row = 1; row !== N_rows; ++row) {
			rowValues = matrix[row];

			if(rowValues.length !== N_cols) {
				// each row has to have the same number of columns
				throw `rowValues.length !== Ncols: ${rowValues.length} !== ${N_cols}`;
			}

			for(let col = 0; col !== N_cols; ++col) {
				transposed[col][row] = rowValues[col];
			}
		}

		return transposed;
	}


	//**************************************************************************
	// Skips lines like "Columns \d+ through \d+" or "Columns \d+ and \d+"
	// All the other lines are pushed onto the elements array.
	public static extractArrayElements(value: string, isComplex: boolean): Array<Array<string>> {
		const mutipleColumnsGroup = /Columns? \d+(?: ((?:through)|(?:and)?) \d+)?:/;
		const inLines = value.trim().split('\n').filter(line => line); // non-empty lines
		const N_lines = inLines.length;
		let elements = new Array<Array<string>>();

		if(inLines[0].match(mutipleColumnsGroup)) {
			let line = 1; // skip mutipleColumnsGroup
			// Grab the elements of the first columns group, row by row.
			for(;line !== N_lines && !inLines[line].match(mutipleColumnsGroup); ++line) {
				// push a new row of elements
				elements.push(Matrix.split(inLines[line], isComplex));
			}
			if(line !== N_lines) {
				++line; // skip mutipleColumnsGroup
			}
			// If it has more columns groups concatenate row elements with existing rows
			for(let row = 0; line !== N_lines; ++line) {
				if(inLines[line].match(mutipleColumnsGroup)) {
					row = 0; // reached a new column group: reset row index
				} else {
					// concatenate current row elements with an existing row
					Array.prototype.push.apply(elements[row++], Matrix.split(inLines[line], isComplex));
				}
			}
		} else {
			for(let line = 0; line !== N_lines; ++line) {
				elements.push(Matrix.split(inLines[line], isComplex));
			}
		}
		// We want to return an array that is indexed by column
		return Matrix.transpose(elements);
	}
}
