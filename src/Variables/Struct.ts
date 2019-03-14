import { ScalarStruct } from './ScalarStruct';
import * as Constants from '../Constants';
import { Variables } from './Variables';
import { Variable } from './Variable';
import { Runtime } from '../Runtime';
import { Matrix } from './Matrix';


// This is actually an array much like a matrix.
export class Struct extends Matrix {
	//**************************************************************************
	private static STRUCT_TYPENAME: string = 'struct';
	private _fields: Array<string>;


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
		super(name, value, freeIndices, fixedIndices, false, Struct.STRUCT_TYPENAME);
		this._fields = value.split(Constants.FIELDS_SEPARATOR);
	}


	//**************************************************************************
	private static remove(prefix: string, fields: Array<string>): Array<string> {
		const N = prefix.length;
		return fields.map((v: string) => v.substr(N));
	}


	//**************************************************************************
	public typename(): string { return Struct.STRUCT_TYPENAME; }


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
	): Struct
	{
		return new Struct(name, value, freeIndices, fixedIndices);
	}


	//**************************************************************************
	public loadNew(
		name: string,
		type: string,
		runtime: Runtime,
		callback: (s: Struct) => void
	): void
	{
		ScalarStruct.getFields(name, runtime, (fields: Array<string>) => {
			fields = Struct.remove(name, fields);
			const value = fields.join(Constants.FIELDS_SEPARATOR);

			Variables.getSize(name, runtime, (size: Array<number>) => {
				const struct = this.createConcreteType(name, value, size, [], false, type);
				callback(struct);
			});
		});
	}


	//**************************************************************************
	public createChildType(
		value: string,
		freeIndices: Array<number>,
		fixedIndices: Array<number>,
		validValue: boolean
	): Variable
	{
		let struct;

		if(freeIndices.length === 0) {
			// if there are no free indices then the variable is a scalar struct
			const name = this.makeName(this.basename(), freeIndices, fixedIndices);
			const fields = this._fields.map((v: string) => name + v);
			struct = new ScalarStruct(name, fields);
		} else {
			// whem we have a free indices, the variable is still a struct
			struct = this.createConcreteType(this.basename(), value, freeIndices, fixedIndices, validValue, Struct.STRUCT_TYPENAME);
		}

		return struct;
	}


	//**************************************************************************
	public loadChildrenRange(
		runtime: Runtime,
		offset: number,
		count: number,
		callback: (vars: Array<Variable>) => void
	): void
	{
		const vars = new Array<Variable>(count);
		const freeIndices = this.freeIndices();
		const fixedIndices = this.fixedIndices();
		const childrenFreeIndices = freeIndices.slice(0, freeIndices.length - 1);
		// Just to make sure the value didn't change, we create it again.
		const value = this._fields.join(Constants.FIELDS_SEPARATOR);

		for(let i = 0; i !== count; ++i) {
			const childFixedIndices = [i + offset + 1].concat(fixedIndices);
			vars[i] = this.createChildType(value, childrenFreeIndices, childFixedIndices, false);
		}

		callback(vars);
	}
}
