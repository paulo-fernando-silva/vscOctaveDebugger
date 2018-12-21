import { Scalar } from './Scalar';

export class SqString extends Scalar  {
	//**************************************************************************
	constructor(
		name: string = '',
		value: string = ''
	)
	{
		super(name, value);
	}


	//**************************************************************************
	public typename(): string { return 'sq_string'; }


	//**************************************************************************
	public loads(type: string): boolean {
		return type === this.typename();
	}


	//**************************************************************************
	public createConcreteType(
		name: string,
		value: string
	): SqString
	{
		return new SqString(name, value);
	}
}
