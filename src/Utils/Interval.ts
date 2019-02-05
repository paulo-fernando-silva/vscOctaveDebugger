//**************************************************************************
export class Interval {
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
	public intersect(interval: Interval): Interval {
		return new Interval(
			Math.max(interval.min(), this.min()),
			Math.min(interval.max(), this.max())
		);
	}


	//**************************************************************************
	public contains(point: number): boolean {
		return this.min() <= point && point <= this.max();
	}


	//**************************************************************************
	public contigous(interval: Interval): boolean {
		return this.contains(interval.min())
			|| this.contains(interval.max());
	}


	//**************************************************************************
	public expandWith(interval: Interval): void {
		this._min = Math.min(this._min, interval._min);
		this._max = Math.max(this._max, interval._max);
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
