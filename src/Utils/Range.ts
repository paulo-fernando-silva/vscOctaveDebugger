//**************************************************************************
export class Range {
	private _min = 0;
	private _max = 0;


	//**************************************************************************
	public constructor(
		min: number = 0,
		max: number = 0)
	{
		this._min = Math.min(min, max);
		this._max = max;
	}


	//**************************************************************************
	public intersect(range: Range): Range {
		return new Range(
			Math.max(range.min(), this.min()),
			Math.min(range.max(), this.max())
		);
	}


	//**************************************************************************
	public contains(point: number): boolean {
		return this.min() <= point && point <= this.max();
	}


	//**************************************************************************
	public contigous(range: Range): boolean {
		return this.contains(range.min())
			|| this.contains(range.max());
	}


	//**************************************************************************
	public expandWith(range: Range): void {
		this._min = Math.min(this._min, range._min);
		this._max = Math.max(this._max, range._max);
	}


	//**************************************************************************
	public min(): number {
		return this._min;
	}


	//**************************************************************************
	public max(): number {
		return this._max;
	}


	//**************************************************************************
	public size(): number {
		return this.max() - this.min();
	}


	//**************************************************************************
	public empty(): boolean {
		return this.max() === this.min();
	}
}
