import { CommandInterface } from '../Commands';
import * as Constants from '../Constants';
import { Variables } from './Variables';
import { Variable } from './Variable';


export class String extends Variable {
	private static readonly STR_TYPE = 'string';
	private static readonly ESC_STR_TYPE = 'sq_string';
	private _size: Array<number>;
	private _validValue: boolean;
	private _typename: string;
	private _children: Array<Variable>;


	//**************************************************************************
	constructor(
		name: string = '',
		value: string = '',
		validValue: boolean = true,
		size: Array<number> = [],
		type: string = String.STR_TYPE
	)
	{
		super();
		this._name = name;
		this._value = value;
		this._validValue = validValue;
		this._size = size;
		this._typename = type;
		this._numberOfChildren = 0;

		if(this._size.length !== 0) {
			// Unlike other variables, we split strings by rows (lines), and then columns (chars).
			// Seems like strings are always 2D arrays:
			if(this.isLines()) {
				// In this case each child is a line
				this._numberOfChildren = this._size[0];
			} else {
				// In this case there's only one line, so each child is a char
				this._numberOfChildren = this._size[1];
			}
			if(!this.isChar()) {
				Variables.addReferenceTo(this);
			}
		}
	}


	//**************************************************************************
	public typename(): string { return this._typename; }


	//**************************************************************************
	public loads(type: string): boolean {
		return type === String.STR_TYPE || type === String.ESC_STR_TYPE;
	}


	//**************************************************************************
	public extendedTypename(): string { return this.typename(); }


	//**************************************************************************
	public createConcreteType(
		name: string,
		value: string,
		validValue: boolean,
		size: Array<number>,
		type: string
	): String
	{
		return new String(name, value, validValue, size, type);
	}


	//**************************************************************************
	public loadNew(
		name: string,
		type: string,
		runtime: CommandInterface,
		callback: (variable: String) => void
	): void
	{
		Variables.getSize(name, runtime, (size: Array<number>) => {
			const loadable = Variables.loadable(size);

			const buildWith = (value: string) => {
				const v = this.createConcreteType(name, value, loadable, size, type);
				callback(v);
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
		start: number,
		count: number,
		callback: (vars: Array<Variable>) => void
	): void
	{
		if(this._numberOfChildren === 0) {
			throw "Error: String has no children!";
		}

		if(count === 0 && start === 0) {
			count = this._numberOfChildren;
		}

		if(this._children === undefined) {
			this._children = new Array<Variable>(this._numberOfChildren);
		}

		if(start + count > this._children.length) {
			throw `Error: start+count > #children: ${start}+${count} > ${this._children.length}`;
		}

		if(this.childrenNeedLoading(start, count)) {
			if(this._validValue) {
				this.parseChildren(this._value, this._numberOfChildren, start, count, callback);
			} else {
				// Load by chunks (rows might be huge), use load new for each child...
				const childLength = this.childrenLength();
				// If children are individually loadable, the we load them as a block
				// even if the block itself wouldn't necessarily be loadable.
				const loadable = Variables.loadable([1, 1], childLength);
				if(loadable) {
					this.loadChildrenBlock(runtime, start, count, callback);
				} else {
					this.createChildrenPlaceholders(runtime, start, count, callback);
				}
			}
		}
	}


	//**************************************************************************
	private createChildrenPlaceholders(
		runtime: CommandInterface,
		start: number,
		count: number,
		callback: (vars: Array<Variable>) => void
	): void
	{
		const name = this.name();
		const type = this.typename();
		const childLength = this.childrenLength();
		const size = [1, childLength];
		const range = (childLength === 1?'':',:');
		const value = size.join(Constants.SIZE_SEPARATOR)
		for(let i = 0; i !== count; ++i) {
			const idx = start + i + 1; // matlab indices start at 1
			const v = this.createConcreteType(`${name}(${idx}${range})`, value, false, size, type);
			this._children[start + i] = v;

		}
		callback(this._children.slice(start, start+count));
	}


	//**************************************************************************
	private loadChildrenBlock(
		runtime: CommandInterface,
		start: number,
		count: number,
		callback: (vars: Array<Variable>) => void
	): void
	{
		const name = this.name();
		const range = `${start + 1}:${start+count}`; // indices start at 1
		let rangeName: string;
		let ansRegex: RegExp;
		if(this.isLine()) {
			rangeName = `${name}(${range})`;
			ansRegex = Variables.ANS_AND_SPACE_REGEX;
		} else {
			rangeName = `${name}(${range},:)`;
			ansRegex = Variables.ANS_AND_NEW_LINE_REGEX;
		}
		Variables.getRawValue(rangeName, runtime, (value: string) => {
			value = value.replace(ansRegex, '');
			this.parseChildren(value, count, start, count, callback);
		});
	}


	//**************************************************************************
	private parseChildren(
		value: string,
		numVals: number,
		start: number,
		count: number,
		callback: (vars: Array<Variable>) => void
	): void
	{
		let values: Array<string>;
		// Children should all be the same length:
		const childLength = this.childrenLength();
		// Make sure the value makes sense
		if(numVals * childLength > value.length || count > value.length) {
			throw `String value is invalid`;
		}
		if(this.isLine()) {
			values = value.split('');
		} else {
			// Since we have an array of strings, we need to split by string length.
			values = new Array<string>(numVals);
			for(let i = 0, begin = 0; i !== numVals; ++i) {
				values[i] = value.substring(begin, begin + childLength);
				// Split value into child values: (+1 skips extra \n)
				begin += childLength + 1;
			}
		}
		// This works for both strings, or individual characters, which are the same base type.
		const name = this.name();
		const type = this.typename();
		const size = [1, childLength];
		const range = (childLength === 1?'':',:');
		// Assuming that values either contains all children, or just the count of them
		const valuesOffset = (values.length < start+count? 0 : start);
		// We're assuming that these variables have not been loaded.
		for(let i = 0; i !== count; ++i) {
			const val = values[valuesOffset + i];
			const idx = start + i + 1; // matlab indices start at 1
			const v = this.createConcreteType(`${name}(${idx}${range})`, val, true, size, type);
			this._children[start + i] = v;
		}
		// Return the requested variables:
		callback(this._children.slice(start, start+count));
	}


	//**************************************************************************
	private childrenNeedLoading(start: number, count: number): boolean {
		// Not checking all chindren in the range have been loaded.
		// Assuming that they are loaded as blocks, and block size doesn't change.
		return this._children !== undefined
			&& this._children.length >= start + count
			&& this._children[start] === undefined;
	}


	//**************************************************************************
	private isLine(): boolean {
		return this._size.length === 2
			&& this._size[0] === 1
			&& this._size[1] > 1;
	}


	//**************************************************************************
	private childrenLength(): number {
		if(this._size.length === 2) {
			// If we have only 1 line, then children are individual characters
			// Otherwise, children are strings of length #columns, i.e.:
			return (this._size[0] !== 1? this._size[1] : 1);
		}
		// We don't have a valid size:
		return 0;
	}


	//**************************************************************************
	private isChar(): boolean {
		return this._size.length === 2
			&& this._size[0] === 1
			&& this._size[1] === 1;
	}

	//**************************************************************************
	private isLines(): boolean {
		return this._size.length === 2
			&& this._size[0] > 1;
	}
}
