import { Variable } from './Variable';
import { Variables } from './Variables';
import { Runtime } from '../Runtime';


export class ScalarStruct extends Variable {
	//**************************************************************************
	private _fields: Array<string>;


	//**************************************************************************
	constructor(name: string = '',
				value: string = '',
				fields: Array<string> = [])
	{
		super();
		this._name = name;
		this._value = value;
		this._fields = fields;
		this._numberOfChildren = this._fields.length;
	}


	//**************************************************************************
	public typename(): string { return 'scalar struct'; }


	//**************************************************************************
	public loads(type: string): boolean {
		return type === this.typename();
	}


	//**************************************************************************
	public load(name: string,
				runtime: Runtime,
				callback: (v: Variable) => void): void
	{
		ScalarStruct.getFields(name, runtime, (fields: Array<string>) => {
			// TODO: Then parent sync issue is fixed display something interesting.
			ScalarStruct.getFieldValues(fields, runtime, (values: Array<string>) => {
				const value = values.join(', ');
				const struct = new ScalarStruct(name, `{${value}}`, fields);

				Variables.addReferenceTo(struct);
				callback(struct);
			});
		});
	}


	//**************************************************************************
	public listChildren(runtime: Runtime,
						count: number,
						start: number,
						callback: (vars: Array<Variable>) => void): void
	{
		// TODO: handle children range
		Variables.listVariables(this._fields, runtime, callback);
	}


	//**************************************************************************
	public static getFields(name: string,
							runtime: Runtime,
							callback: (f: Array<string>) => void): void
	{
		let fieldnames = new Array<string>();
		let syncRegex;

		runtime.addInputHandler((str: string) => {
			if(str.match(syncRegex) !== null) {
				callback(fieldnames);
				return true;
			}

			const match = str.match(/^(?:\s*\[\d+,1\] = )(\w+)$/);
			if(match !== null && match.length > 1) {
				fieldnames.push(`${name}.${match[match.length - 1]}`);
			}

			return false;
		});

		runtime.send(`fieldnames(${name})`);
		syncRegex = Runtime.syncRegEx(runtime.sync());
	}


	//**************************************************************************
	public static getFieldValues(	fields: Array<string>,
									runtime: Runtime,
									callback: (values: Array<string>) => void): void
	{
		let values = new Array<string>();

		fields.forEach(field => Variables.getValue(field, runtime, (value: string) => {
			values.push(value);

			if(values.length === fields.length) {
				callback(values);
			}
		}));
	}
}
