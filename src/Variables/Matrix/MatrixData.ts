/*
 * Represents the parsed matrix data.
 * Assumes the data is in column order.
 * Use Transpose to switch between row and column major.
 */
export class MatrixData {
	// e.g. given ans(:,:,1,1), it becomes (:,:,1,1)
	private _indices: string;
	// The original string from where the values were parsed:
	private _value: string;
	// The matrix values:
	private _vectors: Array<Array<string>>;

	public constructor(indices: string, value: string, vectors: Array<Array<string>>) {
		this._indices = indices;
		this._value = value;
		this._vectors = vectors;
	}

	public indices(): string {
		return this._indices;
	}

	public value(): string {
		return this._value;
	}

	public vector(i: number): Array<string> {
		return this._vectors[i];
	}

	public size(): number {
		return this._vectors.length;
	}

	//**************************************************************************
	public transpose() {
		this._vectors = MatrixData.transpose(this._vectors);
	}

	//**************************************************************************
	public static transpose(vectors: Array<Array<string>>): Array<Array<string>> {
		const N_rows = vectors.length;

		if(N_rows === 0)
			return new Array<Array<string>>();

		let rowValues = vectors[0];
		const N_cols = rowValues.length;
		const transposed = new Array<Array<string>>(N_cols);

		for(let col = 0; col !== N_cols; ++col) {
			transposed[col] = new Array<string>(N_rows);
			transposed[col][0] = rowValues[col];
		}

		for(let row = 1; row !== N_rows; ++row) {
			rowValues = vectors[row];

			if(rowValues.length !== N_cols) {
				// each row has to have the same number of columns
				throw `rowValues.length !== Ncols: ${rowValues.length} !== ${N_cols}`;
			}

			for(let col = 0; col !== N_cols; ++col) {
				transposed[col][row] = rowValues[col];
			}
		}

		return transposed;
	}
}
