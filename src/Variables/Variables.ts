import { OctaveLogger } from '../OctaveLogger';
import { CommandInterface } from '../Commands';
import * as Constants from '../Constants';
import { Variable } from './Variable';


export class Variables {
	//**************************************************************************
	private static readonly _EMPTY_ARRAY = new Array<Variable>();
	private static readonly _FACTORIES = new Array<Variable>();
	private static readonly _REFS = new Array<Variable>();
	private static _CHUNKS_PREFETCH = Constants.CHUNKS_PREFETCH;
	private static _FALLBACK: Variable;

	public static evaluateAns = false;


	//**************************************************************************
	public static setChunkPrefetch(n: number) {
		if(n > 0) {
			Variables._CHUNKS_PREFETCH = n;
		}
	}


	//**************************************************************************
	public static getMaximumElementsPrefetch(): number {
		return Variables._CHUNKS_PREFETCH * Constants.CHUNKS_SIZE;
	}


	//**************************************************************************
	// Register concrete type prototype factories
	//**************************************************************************
	public static register(factory: Variable) {
		Variables._FACTORIES.push(factory);
	}


	//**************************************************************************
	public static registerFallback(factory: Variable) {
		Variables._FALLBACK = factory;
	}


	//**************************************************************************
	public static getReference(name: string): number {
		for(let i = 0; i != Variables._REFS.length; ++i) {
			const v = Variables._REFS[i];
			if(v.name() == name)
				return v.reference();
		}

		return 0;
	}


	//**************************************************************************
	// This is used to retrive variables with children.
	//**************************************************************************
	public static addReferenceTo(v: Variable): void {
		v.setReference(Variables._REFS.length + 1); // References start at 1;
		Variables._REFS.push(v);
	}


	//**************************************************************************
	public static getByReference(reference: number): Variable | null {
		if(reference > 0) {
			const index = reference - 1; // References start at 1;
			if(index < Variables._REFS.length) {
				return Variables._REFS[index];
			}
		} else {
			OctaveLogger.error(`Error: getVariable(${reference})!`);
		}

		return null;
	}


	//**************************************************************************
	public static clearReferences(): void {
		Variables._REFS.length = 0;
	}


	//**************************************************************************
	// List variables under a parent variable.
	//**************************************************************************
	public static listByReference(
		ref: number,
		runtime: CommandInterface,
		count: number,
		start: number,
		callback: (variables: Array<Variable>) => void
	): void
	{
		const variable = Variables.getByReference(ref);
		if(variable !== null) {
			variable.listChildren(runtime, count, start, callback);
		} else {
			OctaveLogger.error(`Error: listByReference invalid reference ${ref}`);
			callback(Variables._EMPTY_ARRAY);
		}
	}


	//**************************************************************************
	private static skipVariable(name: string): boolean {
		return !Variables.evaluateAns && name === 'ans';
	}


	//**************************************************************************
	public static listVariables(
		names: Array<string>,
		runtime: CommandInterface,
		callback: (variables: Array<Variable>) => void
	): void
	{
		const variables = new Array<Variable>();
		let skipped = 0;

		names.forEach(name => {
			Variables.loadVariable(name, runtime, (v: Variable | null) => {
				if(v === null) {
					if(!Variables.skipVariable(name)) {
						OctaveLogger.error(`Error: could not load variable '${name}'!`);
					}
					++skipped;
				} else {
					variables.push(v);
				}

				if(variables.length + skipped === names.length) {
					callback(variables);
				}
			});
		});
	}


	//**************************************************************************
	public static loadVariable(
		name: string,
		runtime: CommandInterface,
		callback: (v: Variable | null) => void
	): void
	{
		if(!Variables.skipVariable(name)) {
			Variables.getType(name, runtime, (type: string) => {
				for(let i = 0; i !== Variables._FACTORIES.length; ++i) {
					const factory = Variables._FACTORIES[i];

					if(factory.loads(type)) {
						factory.loadNew(name, type, runtime, callback);
						return;
					}
				}

				if(Variables._FALLBACK !== null && Variables._FALLBACK.loads(type)) {
					Variables._FALLBACK.loadNew(name, type, runtime, callback);
				} else {
					callback(null);
				}
			});
		} else {
			callback(null);
		}
	}


	//**************************************************************************
	public static setVariable(
		name: string,
		value: string,
		runtime: CommandInterface,
		callback: (newValue: string) => void
	): void
	{
		runtime.evaluateAsLine(`${name} = ${value}`, (result: string) => {
			// We could use 'result' here, but for consistency we get the value.
			Variables.getValue(name, runtime, callback);
		});
	}


	//**************************************************************************
	private static readonly CLEAN_REGEX = /^\s*ans =\s*/;
	public static clean(value: string): string {
		return value.replace(Variables.CLEAN_REGEX, '').trim();
	}


	//**************************************************************************
	public static getType(
		variable: string,
		runtime: CommandInterface,
		callback: (type: string) => void
	): void
	{
		runtime.evaluateAsLine(`typeinfo(${variable})`, (value: string) => {
			callback(Variables.clean(value));
		});
	}


	//**************************************************************************
	public static getValue(
		variable: string,
		runtime: CommandInterface,
		callback: (value: string) => void
	): void
	{
		runtime.evaluateAsLine(variable, (value: string) => {
			callback(Variables.removeName(variable, value));
		});
	}


	//**************************************************************************
	public static getSize(
		variable: string,
		runtime: CommandInterface,
		callback: (s: Array<number>) => void
	): void
	{
		runtime.evaluateAsLine(`size(${variable})`, (value: string) => {
			const values = Variables.clean(value).split(' ').filter((val) => val);
			const size = values.map(i => parseInt(i));
			callback(size);
		});
	}


	//**************************************************************************
	public static getNonZero(
		variable: string,
		runtime: CommandInterface,
		callback: (n: number) => void
	): void
	{
		runtime.evaluateAsLine(`nnz(${variable})`, (value: string) => {
			callback(parseInt(Variables.clean(value)));
		});
	}


	//**************************************************************************
	private static readonly ESCAPE_REGEX = /[.*+?^${}()|[\]\\]/g;
	public static escape(str: string): string {
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
		return str.replace(Variables.ESCAPE_REGEX, '\\$&'); // $& means the whole matched string
	}


	//**************************************************************************
	public static removeName(name: string, value: string): string {
		name = Variables.escape(name.trim());
		value = value.replace(new RegExp(`^\\s*(?:ans|${name}) =(?:\n\n)?\\s*`), '');
		return value.trim();
	}


	//**************************************************************************
	public static loadable(
		sizes: Array<number>,
		count: number = 0
	): boolean
	{
		const N = sizes.reduce((acc, val) => acc *= val, 1);

		if(count !== 0) {
			return sizes.length <= 1 && N * count <= Variables.getMaximumElementsPrefetch();
		}

		return sizes.length <= 2 && N <= Variables.getMaximumElementsPrefetch();
	}
}
