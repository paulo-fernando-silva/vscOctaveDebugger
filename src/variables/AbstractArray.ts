import { Variables } from './Variables';
import { Variable } from './Variable';
import { Runtime } from '../Runtime';


export abstract class AbstractArray extends Variable {
	//**************************************************************************
	protected abstract makeConcreteType(
		name: string,
		value: string,
		size: Array<number>
	): AbstractArray;


	//**************************************************************************
	public load(name: string,
				runtime: Runtime,
				callback: (v: Variable) => void)
	{
		Variables.getSize(name, runtime, (size: Array<number>) => {
			// TODO: VSC doesn't seem to support updating parents when children change.
			Variables.getValue(name, runtime, (value: string) => {
				const array = this.makeConcreteType(name, value, size);
				Variables.addReferenceTo(array);
				callback(array);
			});
		});
	}


	//**************************************************************************
	protected static firstNonOne(size: Array<number>) {
		for(let i = 0; i !== size.length; ++i) {
			if(size[i] > 1) {
				return i;
			}
		}

		return size.length;
	}


	//**************************************************************************
	protected static childName(
		name: string,
		index: number,
		dimensions: number,
		firstNonOne: number
	) : string
	{
		let prefix = '', suffix = '';

		// Extract any existing indices if any
		const match = name.match(/^(\w+)\(([^:]+,):(.*)\)$/);
		if(match !== null && match.length > 1) {
			name = match[1];
			prefix = match[2];
			suffix = match[3];
		} else { // calculate new indices
			for(let i = 0; i !== firstNonOne; ++i) {
				prefix += '1,'; // Same as prefix = Array(firstNonOne).join('1,')
			}

			for(let i = 1 + firstNonOne; i !== dimensions; ++i) {
				suffix += ',:'; // Same as suffix = Array(dimensions - firstNonOne).join(',:')
			}
		}

		return `${name}(${prefix}${index+1}${suffix})`;
	}
}
