import { CommandInterface } from '../Commands';
import * as Constants from '../Constants';
import { Variables } from './Variables';
import { Variable } from './Variable';


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
		this.setFullname(name);
		this._value = value;
		// Use original typename before changing it.
		this._extendedTypename =
			`${this._typename}: ${type} ${size.join(Constants.SIZE_SEPARATOR)}`;
		this._typename = type;
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
		type: string,
		runtime: CommandInterface,
		callback: (u: UnknownType) => void
	): void
	{
		Variables.getSize(name, runtime, (size: Array<number>) => {
			const loadable = Variables.loadable(size);

			const buildWith = (value: string) => {
				const v = this.createConcreteType(name, value, type, size);
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
	{} // UnknownType have no children.
}
