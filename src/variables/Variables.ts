import { Runtime } from '../Runtime';
import { Variable } from './Variable';
import * as Constants from '../Constants';


export class Variables {
	//**************************************************************************
	private static _FACTORIES = new Array<Variable>();
	private static _FALLBACK: Variable;
	private static _REFS = new Array<Variable>();
	private static _MAXIMUM_INDICES_PREFETCH = Constants.MAXIMUM_INDICES_PREFETCH;

	//**************************************************************************
	public static setPrefetch(n: number) {
		if(n >= 0) {
			Variables._MAXIMUM_INDICES_PREFETCH = n;
		}
	}


	//**************************************************************************
	public static getPrefetch(): number {
		return Variables._MAXIMUM_INDICES_PREFETCH;
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
			console.log(`Error: getVariable(${reference})!`);
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
	public static listByReference(	ref: number,
									runtime: Runtime,
									count: number,
									start: number,
									callback: (variables: Array<Variable>) => void)
	{
		const variable = Variables.getByReference(ref);
		if(variable !== null) {
			variable.listChildren(runtime, count, start, callback);
		} else {
			console.log(`Error: listByReference invalid reference ${ref}`);
		}
	}


	//**************************************************************************
	public static listVariables(names: Array<string>,
								runtime: Runtime,
								callback: (variables: Array<Variable>) => void)
	{
		const variables = new Array<Variable>();
		let skipped = 0;

		names.forEach(name => {
			Variables.loadVariable(name, runtime, (v: Variable | null) => {
				if(v === null) {
					console.log(`Error: could not load variable '${name}'!`);
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
	public static loadVariable(	name: string,
								runtime: Runtime,
								callback: (v: Variable | null) => void)
	{
		if(name !== 'ans') {
			Variables.getType(name, runtime, (type: string) => {
				for(let i = 0; i !== Variables._FACTORIES.length; ++i) {
					const factory = Variables._FACTORIES[i];

					if(factory.loads(type)) {
						factory.load(name, runtime, callback);
						return;
					}
				}

				if(Variables._FALLBACK !== null && Variables._FALLBACK.loads(type)) {
					Variables._FALLBACK.load(name, runtime, callback);
				} else {
					callback(null);
				}
			});
		} else {
			callback(null);
		}
	}


	//**************************************************************************
	public static setVariable(	name: string,
								value: string,
								runtime: Runtime,
								callback: (newValue: string) => void): void
	{
		runtime.evaluate(`${name} = ${value}`, (result: string) => {
			console.log(`setVariable operation result: ${result}`);
			Variables.getValue(name, runtime, callback);
		});
	}


	//**************************************************************************
	public static getType(	variable: string,
							runtime: Runtime,
							callback: (type: string) => void)
	{
		runtime.evaluate(`typeinfo(${variable})`, (value: string) => {
			value = value.replace(/^ans =\s*/, '');
			callback(value);
		});
	}


	//**************************************************************************
	public static getValue(	variable: string,
							runtime: Runtime,
							callback: (value: string) => void)
	{
		runtime.evaluate(variable, (value: string) => {
			callback(Variables.removeName(variable, value));
		});
	}


	//**************************************************************************
	public static getSize(	variable: string,
							runtime: Runtime,
							callback: (s: Array<number>) => void)
	{
		runtime.evaluate(`size(${variable})`, (value: string) => {
			value = value.replace(/^ans =\s*/, '');
			const values = value.split(' ').filter((val) => val);
			const size = values.map(i => parseInt(i));
			callback(size);
		});
	}


	//**************************************************************************
	private static removeName(name: string, value: string): string {
		return value.replace(new RegExp(`^(?:ans|${name}) =(?:\n\n)?\s*`), '').trim();
	}
}
