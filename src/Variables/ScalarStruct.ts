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
	public static setSplitStyle(splitFieldnamesOctaveStyle: boolean): void {
		if(splitFieldnamesOctaveStyle) {
			ScalarStruct.split = ScalarStruct.splitOctaveStyle;
		} else {
			ScalarStruct.split = ScalarStruct.splitMatlabStyle;
		}
	}


	//**************************************************************************
	private static split: (value: string) => string[] = ScalarStruct.splitMatlabStyle;
	//**************************************************************************
	public static getFields(
		name: string,
		runtime: CommandInterface,
		callback: (f: Array<string>) => void
	): void
	{
		let fieldnames = new Array<string>();
		runtime.evaluateAsLine(`fieldnames(${name})`, (output: string) => {
			const fields = ScalarStruct.split(output);

			fields.forEach(field => {
				fieldnames.push(`${name}.${field}`);
			});

			callback(fieldnames);
		});
	}


	//**************************************************************************
	private static readonly CLEAN_REGEX = /^\{\n((?:.*|\s*)*)\n\}$/;
	private static readonly FIELDS_REGEX = /\n?  \[\d+,1\] = /;
	private static readonly NON_WORD_REGEX = /\W/;
	//**************************************************************************
	// e.g. value =
	//ans = {
	// 	[1,1] =
	// 	[2,1] = b
	// 	[3,1] =
	// 	[4,1] =
	// 	[5,1] = \n
	//}
	private static splitOctaveStyle(value: string): string[] {
		value = Variables.clean(value); // remove ans =

		const match = value.match(ScalarStruct.CLEAN_REGEX);

		if(match !== null && match.length === 2) {
			value = match[1]; // remove {\n and }\n
		}

		const fields = value.split(ScalarStruct.FIELDS_REGEX);
		// Remove the first field because it's empty as there's nothing before [1,1].
		fields.shift();

		for(let i = 0; i !== fields.length; ++i) {
			const field = fields[i];

			if(field.length === 0 || ScalarStruct.NON_WORD_REGEX.test(field)) {
				fields[i] = `('${field}')`; // escape fieldname
			}
		}

		return fields;
	}


	//**************************************************************************
	private static readonly FIELD_REGEX = /^[a-zA-Z]\w*$/;
	// Matlab is more restrictive, only \w are valid in fieldnames.
	// Furthermore, field names must begin with a letter.
	// https://www.mathworks.com/help/matlab/matlab_prog/generate-field-names-from-variables.html
	private static splitMatlabStyle(value: string): string[] {
		value = Variables.clean(value); // remove ans =

		const match = value.match(ScalarStruct.CLEAN_REGEX);

		if(match !== null && match.length === 2) {
			value = match[1]; // remove {\n and }\n
		}

		let fields = value.split(ScalarStruct.FIELDS_REGEX);
		// Remove the first field because it's empty as there's nothing before [1,1].
		fields.shift();

		fields = fields.filter(field =>
			field.length !== 0 && ScalarStruct.FIELD_REGEX.test(field)
		);

		return fields;
	}
}
