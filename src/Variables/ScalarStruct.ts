import { CommandInterface } from '../Runtime';
import * as Constants from '../Constants';
import { Variables } from './Variables';
import { Variable } from './Variable';


export class ScalarStruct extends Variable {
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
	public typename(): string { return 'scalar struct'; }


	//**************************************************************************
	public extendedTypename(): string { return this.typename(); }


	//**************************************************************************
	public loads(type: string): boolean { return type === this.typename(); }


	//**************************************************************************
	public createConcreteType(
		name: string,
		fields: Array<string>
	): ScalarStruct
	{
		return new ScalarStruct(name, fields);
	}


	//**************************************************************************
	public loadNew(
		name: string,
		type: string,
		runtime: CommandInterface,
		callback: (ss: ScalarStruct) => void
	): void
	{
		ScalarStruct.getFields(name, runtime, (fields: Array<string>) => {
			const struct = this.createConcreteType(name, fields);
			callback(struct);
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
	private static readonly FIELDS_REGEX = /^(?:\s*\[\d+,1\] = )(\w+)$/;
	public static getFields(
		name: string,
		runtime: CommandInterface,
		callback: (f: Array<string>) => void
	): void
	{
		let fieldnames = new Array<string>();
		runtime.evaluate(`fieldnames(${name})`, (output: string[]) => {
			output.forEach(line => {
				const match = line.match(ScalarStruct.FIELDS_REGEX);

				if(match !== null && match.length > 1) {
					fieldnames.push(`${name}.${match[match.length - 1]}`);
				}
			});

			callback(fieldnames);
		});
	}
}
