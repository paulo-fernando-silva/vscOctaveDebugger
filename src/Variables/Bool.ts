import { Scalar } from './Scalar';

export class Bool extends Scalar {
	//**************************************************************************
	constructor(
		name: string = '',
		value: string = ''
	)
	{
		super(name, value);
	}


	//**************************************************************************
	public typename(): string { return 'bool'; }


	//**************************************************************************
	public loads(type: string): boolean { return type === this.typename(); }


	//**************************************************************************
	public createConcreteType(
		name: string,
		value: string
	): Bool
	{
		return new Bool(name, value);
	}
}
