import { CommandInterface } from '../Runtime';
import { Variables } from './Variables';
import { Variable } from './Variable';


export class String extends Variable {
	private static readonly STR_TYPE = 'string';
	private static readonly ESC_STR_TYPE = 'sq_string';
	private _typename: string;
	private _children: Array<Variable>;


	//**************************************************************************
	constructor(
		name: string = '',
		value: string = '',
		type: string = String.STR_TYPE
	)
	{
		super();
		this._name = name;
		this._value = value;
		this._typename = type;

		if(this._value.length > 1) {
			this._numberOfChildren = this._value.length;
			Variables.addReferenceTo(this);
		} else {
			this._numberOfChildren = 0;
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
		type: string
	): String
	{
		return new String(name, value, type);
	}


	//**************************************************************************
	public loadNew(
		name: string,
		type: string,
		runtime: CommandInterface,
		callback: (s: String) => void
	): void
	{
		Variables.getValue(name, runtime, (value: string) => {
			const v = this.createConcreteType(name, value, type);
			callback(v);
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
		if(this._children === undefined) {
			this._children = new Array<Variable>();
			// TODO: Handle chunk/range loading
			const values = this._value.split('');
			const name = this.name();
			const type = this._typename;

			for(let i = 0; i != values.length; ++i) {
				const v = this.createConcreteType(`${name}(${i})`, values[i], type);
				this._children.push(v);
			}
		}

		callback(this._children.slice(start, start+count));
	}
}
