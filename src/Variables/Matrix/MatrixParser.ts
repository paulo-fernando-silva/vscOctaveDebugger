import { MatrixData } from './MatrixData';

/*
 * Contains the logic to parse matrices or all types into string array format.
 */
export class MatrixParser {
	//**************************************************************************
	private static cleanComplex(value: string): string {
		return value.replace(/(?:\s+([\+\-])\s+)/g, "$1");
	}


	//**************************************************************************
	// Splits "123 456 789 0" or "123 + 456i 789 + 0i" into its elements
	// i.e. ["123", "456", "789", "0"] and ["123+456i", "789+0i"] respectively
	private static split(value: string, isComplex: boolean): Array<string> {
		value = value.trim();

		if(isComplex) {
			// Remove spaces in complex numbers
			value = MatrixParser.cleanComplex(value);
		}

		// split by spaces, and remove non-empty elements
		const elements = value.split(' ').filter(line => line);

		return elements;
	}

	//**************************************************************************
	// Skips lines like "Columns \d+ through \d+" or "Columns \d+ and \d+"
	// All the other lines are pushed onto the elements array.
	private static parseMatrixData(value: string, isComplex: boolean): Array<Array<string>> {
		const mutipleColumnsGroup = /Columns? \d+(?: ((?:through)|(?:and)?) \d+)?:/;
		const inLines = value.trim().split('\n').filter(line => line); // non-empty lines
		const N_lines = inLines.length;
		let elements = new Array<Array<string>>();

		if(inLines[0].match(mutipleColumnsGroup)) {
			let line = 1; // skip mutipleColumnsGroup
			// Grab the elements of the first columns group, row by row.
			for(;line !== N_lines && !inLines[line].match(mutipleColumnsGroup); ++line) {
				// push a new row of elements
				elements.push(MatrixParser.split(inLines[line], isComplex));
			}
			if(line !== N_lines) {
				++line; // skip mutipleColumnsGroup
			}
			// If it has more columns groups concatenate row elements with existing rows
			for(let row = 0; line !== N_lines; ++line) {
				if(inLines[line].match(mutipleColumnsGroup)) {
					row = 0; // reached a new column group: reset row index
				} else {
					// concatenate current row elements with an existing row
					Array.prototype.push.apply(elements[row++], MatrixParser.split(inLines[line], isComplex));
				}
			}
		} else {
			for(let line = 0; line !== N_lines; ++line) {
				elements.push(MatrixParser.split(inLines[line], isComplex));
			}
		}
		// We want to return an array that is indexed by column
		return MatrixData.transpose(elements);
	}

	//**************************************************************************
	// We want to to split value into multiple 2D matrix values.
	// That'S done by fiding the "ans(:,:) = " in value, e.g.:
	// Z =
	//
	// ans(:,:,1,1) =
	//
	//	Columns 1 through 9:
	//
  	// 0.2513 + 0.2513i   0.5183 + 0.5183i   0.8558 + 0.8558i   ...
	//
	//	Column 10:
	// ...
	//
	// ans(:,:,2,1) =
	//
	// Columns 1 through 9: ...
	public static parseMatrices(value: string, isComplex: boolean): Array<MatrixData> {
		const valRegex = /\s*ans(\([^\)]+\)) =\s+([^]+?)\s+(ans\([^]+)/;
		const matrices = new Array<MatrixData>();
		// Split input value by its 2D matrix data:
		let tail = value;
		let match = tail.match(valRegex);

		while(match !== null && match.length === 4) {
			// match[0] is the whole matching expression
			const indices = match[1];	// match[1] is the indices of the matrix
			const val = match[2];		// match[2] is the value of that matrix
			tail = match[3];			// match[3] is the remaining string
			matrices.push(new MatrixData(indices, MatrixParser.parseMatrixData(val, isComplex)));
			match = tail.match(valRegex);
		}
		// The last matrix can't be matched by the above regex
		match = tail.match(/\s*ans(\([^\)]+\)) =\s+([^]+)/);
		if(match !== null && match.length === 3) {
			const indices = match[1];	// match[1] is the indices of the matrix
			const val = match[2];		// match[2] is the value of that matrix
			matrices.push(new MatrixData(indices, MatrixParser.parseMatrixData(val, isComplex)));
		}

		return matrices;
	}
}
