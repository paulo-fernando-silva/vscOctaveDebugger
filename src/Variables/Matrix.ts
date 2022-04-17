import { Variable } from './Variable';
import { Variables } from './Variables';
import * as Constants from '../Constants';
import { Interval } from '../Utils/Interval';
import { CommandInterface } from '../Commands';
import { MatrixParser } from './Matrix/MatrixParser';

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
	// This is because mainly because in Octave typesnames might come in two formats.
	// e.g. "complex diagonal matrix" uses "diagonal matrix" in certain places...
	// typename used by Octave when printing the value
	private _typename: string; // typename used by Octave when printing the value
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
	public numberOfFixableIndices(indices: Array<number>): number {
		let fixableIndices = 0;

		if(indices.length !== 0) {
			for(let i = indices.length - 1; i != -1 && indices[i] === 1;  --i) {
				++fixableIndices;
			}
		}

		return fixableIndices;
	}


	//**************************************************************************
	public fixIndices(free: Array<number>, fixed: Array<number>):
		{ free: Array<number>, fixed: Array<number> }
	{
		let fixableIndices = this.numberOfFixableIndices(free);
		// Move the 1's to the fixed indices
		if(fixableIndices !== 0) {
			free = free.slice(0, free.length - fixableIndices);
			fixed = Array(fixableIndices).fill(1).concat(fixed);
		}
		return { free: free, fixed: fixed };
	}


	//**************************************************************************
	public setIndices(free: Array<number>, fixed: Array<number>): void {
		// Here, only non-1 free indices exist. Other indices are fixed.
		const idx = this.fixIndices(free, fixed);
		this._freeIndices = idx.free;
		this._fixedIndices = idx.fixed;
		// Variable name may include indices as needed to get its value.
		this._name = this.makeName(this._basename, this._freeIndices, this._fixedIndices);
		// If we have free indices we have children.
		if(this._freeIndices.length !== 0) {
			this._numberOfChildren = this._freeIndices[this._freeIndices.length - 1];
			// Sanity check only. Number of children should never be 0 if we have free indices.
			if(this._numberOfChildren !== 0) {
				// If we have children, add a reference to this variable so they can be fetched.
				Variables.addReferenceTo(this);
			}
			// Matrices have their size as part of their typename.
			const size = Matrix.getSizeString(this._freeIndices);
			this._extendedTypename = `${this.typename()} ${size}`;
		}
	}


	//**************************************************************************
	private static getSizeString(size: Array<number>): string {
		if(size.length === 1) {
			return `${size}${Constants.SIZE_SEPARATOR}1`;

		}

		return size.join(Constants.SIZE_SEPARATOR);
	}


	//**************************************************************************
	public setValue(val: string, isValid: boolean): void {
		this._validValue = isValid;

		if(isValid) {
			// "this cleanup is done really just for displaying."
			val = val.replace(this._typeRegex, '').replace(/\n\s+/g, '\n').trim();

			if(this.isComplex()) {
				val = MatrixParser.cleanComplex(val);
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
				buildWith(Matrix.getSizeString(size));
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
		// We only unfold one index each time, the size of that index is "count":
		const childFreeIndices = this._freeIndices.length <= 1 ? [] :
			this._freeIndices.slice(0, this._freeIndices.length - 1);
		// The value must to contain data for offset/count range of children:
		const matrices = MatrixParser.parseMatrices(value, this.isComplex());
		// Independent of what the children are, they'll be variables:
		const vars = new Array<Variable>(count);
		if(matrices.length > 1) {
			// If we have many matrices, each child will be a matrix:
			for(let i = 0; i !== count; ++i) {
				const childFixedIndices = [i + offset + 1].concat(this._fixedIndices);
				const value = matrices[i].value();
				vars[i] = this.createChildType(value, childFreeIndices, childFixedIndices, true);
			}
		} else if(matrices.length === 1 && matrices[0].size() > 1) {
			// If we have only one matrix, but many vectors, each child will be a vector:
			const matrix = matrices[0];
			for(let i = 0; i !== count; ++i) {
				const childFixedIndices = [i + offset + 1].concat(this._fixedIndices);
				const vector = matrix.vector(i);
				// TODO: we're converting back the parsed data into string. Seems like a waste.
				const childValue = vector.join(Constants.COLUMN_ELEMENTS_SEPARATOR);
				vars[i] = this.createChildType(childValue, childFreeIndices, childFixedIndices, true);
			}
		} else if(matrices.length === 1 && matrices[0].size() === 1) {
			// If we have only one vector, each child will be a vector entry:
			const vector = matrices[0].vector(0);
			for(let i = 0; i !== count; ++i) {
				const childFixedIndices = [i + offset + 1].concat(this._fixedIndices);
				vars[i] = this.createChildType(vector[i], childFreeIndices, childFixedIndices, true);
			}
		}
		// return the children variables:
		callback(vars);
	}


	//**************************************************************************
	public parseAllChildren(callback: (vars: Array<Variable>) => void): void {
		const value = this._value;

		if(this._freeIndices.length < 1) {
			throw `freeIndices.length: ${this._freeIndices.length}, expected >= 1!`;
		}

		const count = this._freeIndices[this._freeIndices.length - 1];
		const self = this;

		this.parseChildren(value, 0, count, (vars: Array<Variable>) => {
			self._parsedValue = true;
			callback(vars);
		});
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
			const value = Matrix.getSizeString(childrenFreeIndices);
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
}
