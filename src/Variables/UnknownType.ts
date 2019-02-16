import { Variables } from './Variables';
import { Variable } from './Variable';
import { Runtime } from '../Runtime';
import * as Constants from '../Constants';


export class UnknownType extends Variable {
	//**************************************************************************
	private _typename: string = 'UnknownType';
	private _extendedTypename: string;
	private _size: Array<number>;


	//**************************************************************************
	constructor(
		name: string = '',
		value: string = '',
		type: string = '',
		size: Array<number> = [],
	)
	{
		super();
		this._name = name;
		this._value = value;
		this._typename = type;
		this._extendedTypename = `UnknownType: ${type} ${size.join(Constants.SIZE_SEPARATOR)}`;
		this._size = size;
	}


	//**************************************************************************
	public typename(): string { return this._typename; }


	//**************************************************************************
	public extendedTypename(): string { return this._extendedTypename; }


	//**************************************************************************
	public loads(type: string): boolean {
		return type.length !== 0; // this loads every non empty type
	}


	//**************************************************************************
	public size(): Array<number> { return this._size; }


	//**************************************************************************
	public createConcreteType(
		name: string,
		value: string,
		type: string,
		size: Array<number>
	): UnknownType
	{
		return new UnknownType(name, value, type, size);
	}


	//**************************************************************************
	public loadNew(
		name: string,
		runtime: Runtime,
		callback: (u: UnknownType) => void
	): void
	{
		Variables.getType(name, runtime, (type: string) => {
			Variables.getSize(name, runtime, (size: Array<number>) => {
				// Can't get value. Might be too large.
				const value = size.join(Constants.SIZE_SEPARATOR);
				callback(this.createConcreteType(name, value, type, size));
			});
		});
	}


	//**************************************************************************
	public listChildren(
		runtime: Runtime,
		count: number,
		start: number,
		callback: (vars: Array<Variable>) => void
	): void
	{} // UnknownType have no children.
}
