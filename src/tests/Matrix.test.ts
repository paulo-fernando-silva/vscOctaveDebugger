import { ParsedMatrix } from '../variables/ParsedMatrix';
import * as assert from 'assert';
import * as Constants from '../Constants';

describe('Test Matrix', function() {
	describe('Matrix.makeName', function() {
		const name = 'm0D';
		it(`Should return ${name}`, function() {
			assert.equal(ParsedMatrix.makeName(name, [], []), name);
		});
		const freeIndices = [2,3];
		const fixedIndices = [4,5];
		const expectedName = `${name}(:,:,4,5)`;
		it(`Should return ${expectedName}`, function() {
			assert.equal(ParsedMatrix.makeName(name, freeIndices, fixedIndices), expectedName);
		});
	});

	describe('Matrix.extractValuesLines', function() {
		const values = [
			4.6334e-01, 7.9992e-01, 7.4334e-01, 3.5166e-01, 7.7881e-01, 5.7979e-01,
			4.1951e-02, 4.3208e-01, 1.4571e-01, 3.4048e-01, 3.7403e-01, 6.5560e-01,
			7.5752e-01
		];
const value =
`Columns 1 through 8:

   ${values[0]}   ${values[1]}   ${values[2]}   ${values[3]}   ${values[4]}   ${values[5]}   ${values[6]}   ${values[7]}

 Columns 9 through 13:

   ${values[8]}   ${values[9]}   ${values[10]}   ${values[11]}   ${values[12]}
`;
		const expectedValue = `${values[0]}   ${values[1]}   ${values[2]}   ${values[3]}   ${values[4]}   ${values[5]}   ${values[6]}   ${values[7]}   ${values[8]}   ${values[9]}   ${values[10]}   ${values[11]}   ${values[12]}`;

		it(`Should match value '${expectedValue}'`, function() {
			const ans = ParsedMatrix.extractValuesLine(value);
			assert.equal(ans, expectedValue);
		});
	});

	describe('Matrix.parse1D short', function() {
		const name = 'm1D';
		const values = [0.59733, 0.48898, 0.97283];
		const value = `		${values[0]}   ${values[1]}   ${values[2]}`;
		const freeIndices = [values.length];
		const fixedIndices = [2,4,5];

		const children = ParsedMatrix.parse1D(name, value, freeIndices, fixedIndices);
		const expectedChildCount = freeIndices[0];

		it(`Should create ${expectedChildCount} child variables`, function() {
			assert.equal(children.length, expectedChildCount);
		});

		for(let i = 0; i !== values.length; ++i) {
			const val = values[i];
			const child = children[i];
			const expectedName =
			`${name}(${fixedIndices[0]},${i+1},${fixedIndices[1]},${fixedIndices[2]})`;
			it(`Should match ${i}-th child value ${val}`, function() {
				assert.equal(child.value(), val);
			});
			it(`Should match name ${expectedName}`, function() {
				assert.equal(child.name(), expectedName);
			});
		}
	});

	describe('Matrix.parse1D imaginary', function() {
		const name = 'm1D';
		const values = ['0.0720969 + 0.0720969i', '0.8437697 + 0.8437697i', '0.4532340 + 0.4532340i'];
		const value = `		${values[0]}   ${values[1]}   ${values[2]}`;
		const freeIndices = [values.length];
		const fixedIndices = [2,4,5];

		const children = ParsedMatrix.parse1D(name, value, freeIndices, fixedIndices);
		const expectedChildCount = freeIndices[0];

		it(`Should create ${expectedChildCount} child variables`, function() {
			assert.equal(children.length, expectedChildCount);
		});

		for(let i = 0; i !== values.length; ++i) {
			const val = values[i];
			const child = children[i];
			const expectedName =
				`${name}(${fixedIndices[0]},${i+1},${fixedIndices[1]},${fixedIndices[2]})`;
			it(`Should match ${i}-th child value ${val}`, function() {
				assert.equal(child.value(), val);
			});
			it(`Should match name ${expectedName}`, function() {
				assert.equal(child.name(), expectedName);
			});
		}
	});

	describe('Matrix.parse1D long', function() {
		const name = 'm1D';
		const values = [
			4.6334e-01, 7.9992e-01, 7.4334e-01, 3.5166e-01, 7.7881e-01, 5.7979e-01,
			4.1951e-02, 4.3208e-01, 1.4571e-01, 3.4048e-01, 3.7403e-01, 6.5560e-01,
			7.5752e-01
		];
const value =
`Columns 1 through 8:

   ${values[0]}   ${values[1]}   ${values[2]}   ${values[3]}   ${values[4]}   ${values[5]}   ${values[6]}   ${values[7]}

 Columns 9 through 13:

  ${values[8]}   ${values[9]}   ${values[10]}   ${values[11]}   ${values[12]}
`;
		const freeIndices = [values.length];
		const fixedIndices = [2,4,5];

		const children = ParsedMatrix.parse1D(name, value, freeIndices, fixedIndices);
		const expectedChildCount = freeIndices[0];

		it(`Should create ${expectedChildCount} child variables`, function() {
			assert.equal(children.length, expectedChildCount);
		});

		for(let i = 0; i !== values.length; ++i) {
			const val = values[i];
			const child = children[i];
			const expectedName =
			`${name}(${fixedIndices[0]},${i+1},${fixedIndices[1]},${fixedIndices[2]})`;
			it(`Should match ${i}-th child value ${val}`, function() {
				assert.equal(child.value(), val);
			});
			it(`Should match name ${expectedName}`, function() {
				assert.equal(child.name(), expectedName);
			});
		}
	});

	describe('Matrix.parse2D', function() {
		const name = 'm2D';
		const values = [[
			'0.0720969 + 0.0720969i', '0.8437697 + 0.8437697i', '0.4532340 + 0.4532340i',
			'0.3728132 + 0.3728132i', '0.4578918 + 0.4578918i', '0.2673617 + 0.2673617i',
			'0.3595750 + 0.3595750i', '0.4374822 + 0.4374822i', '0.2433045 + 0.2433045i',
		], [
			'0.2571942 + 0.2571942i', '0.8806884 + 0.8806884i', '0.6366056 + 0.6366056i',
			'0.0903121 + 0.0903121i', '0.0477089 + 0.0477089i', '0.7309768 + 0.7309768i',
			'0.0014517 + 0.0014517i', '0.5637025 + 0.5637025i', '0.7037470 + 0.7037470i',
		], [
			'0.8455747 + 0.8455747i', '0.0913287 + 0.0913287i', '0.0333014 + 0.0333014i',
			'0.3085562 + 0.3085562i', '0.3474878 + 0.3474878i', '0.1476501 + 0.1476501i',
			'0.2173087 + 0.2173087i', '0.2924523 + 0.2924523i', '0.4891809 + 0.4891809i'
		]];
const value =
`Columns 1 through 3:

   ${values[0][0]}   ${values[0][1]}   ${values[0][2]}
   ${values[1][0]}   ${values[1][1]}   ${values[1][2]}
   ${values[2][0]}   ${values[2][1]}   ${values[2][2]}

 Columns 4 through 6:

   ${values[0][3]}   ${values[0][4]}   ${values[0][5]}
   ${values[1][3]}   ${values[1][4]}   ${values[1][5]}
   ${values[2][3]}   ${values[2][4]}   ${values[2][5]}

 Columns 7 through 9:

   ${values[0][6]}   ${values[0][7]}   ${values[0][8]}
   ${values[1][6]}   ${values[1][7]}   ${values[1][8]}
   ${values[2][6]}   ${values[2][7]}   ${values[2][8]}
`;
		const rows = [
			values[0].join(Constants.SEPARATOR),
			values[1].join(Constants.SEPARATOR),
			values[2].join(Constants.SEPARATOR)
		];
		// freeIndices.size == two free indices
		const freeIndices = [3,9]; // with 3 and 9 dimensions respectively.
		const fixedIndices = [4,5]; // 4 and 5 are actually 1-based indices

		const children = ParsedMatrix.parse2D(name, value, freeIndices, fixedIndices);
		const expectedChildCount = freeIndices[0];

		it(`Should create ${expectedChildCount} child variables`, function() {
			assert.equal(children.length, expectedChildCount);
		});

		for(let i = 0; i !== rows.length; ++i) {
			const val = rows[i];
			const child = children[i];
			const expectedName = `${name}(${i+1},:,${fixedIndices[0]},${fixedIndices[1]})`;
			it(`Should match ${i}-th child value ${val}`, function() {
				assert.equal(child.value(), val);
			});
			it(`Should match name ${expectedName}`, function() {
				assert.equal(child.name(), expectedName);
			});
		}
	});
});
