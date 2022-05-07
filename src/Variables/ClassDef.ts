import { CommandInterface } from '../Commands';
import * as Constants from '../Constants';
import { Variables } from './Variables';
import { Variable } from './Variable';


export class ClassDef extends Variable {
	//**************************************************************************
	private _fields: Array<string>;
	private _children: Array<Variable>;


	//**************************************************************************
	constructor(
		name: string = '',
		fields: Array<string> = []
	)
	{
		super();
		this._name = name;
		this._value = fields.join(Constants.FIELDS_SEPARATOR);
		this._fields = fields;
		this._numberOfChildren = this._fields.length;
		if(this._numberOfChildren !== 0) {
			this._children = new Array<Variable>();
			Variables.addReferenceTo(this);
		}
	}


	//**************************************************************************
	public typename(): string { return 'object'; }


	//**************************************************************************
	public extendedTypename(): string { return this.typename(); }


	//**************************************************************************
	public loads(type: string): boolean { return type === this.typename(); }


	//**************************************************************************
	public createConcreteType(
		name: string,
		fields: Array<string>
	): ClassDef
	{
		return new ClassDef(name, fields);
	}


	//**************************************************************************
	public loadNew(
		name: string,
		type: string,
		runtime: CommandInterface,
		callback: (obj: ClassDef) => void
	): void
	{
		ClassDef.getProperties(name, runtime, (fields: Array<string>) => {
			const obj = this.createConcreteType(name, fields);
			callback(obj);
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
		const self = this;
		this._fields.forEach(name => {
			Variables.loadVariable(name, runtime, (v: Variable) => {
				self._children.push(v);

				if(self._children.length === self._numberOfChildren) {
					callback(self._children.slice(start, start+count));
				}
			});
		});
	}


	//**************************************************************************
	public static getProperties(
		name: string,
		runtime: CommandInterface,
		callback: (f: Array<string>) => void
	): void
	{
		let fieldnames = new Array<string>();
		runtime.evaluateAsLine(`properties(${name})`, (output: string) => {
			output = output.replace(/properties for class \w+:/, '');
			const fields = output.split(/\s+/).filter((x) => x);

			fields.forEach(field => {
				fieldnames.push(`${name}.${field}`);
			});

			callback(fieldnames);
		});
	}
}
