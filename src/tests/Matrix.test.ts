import { OctaveLogger } from '../Utils/OctaveLogger';
import { Variable } from '../Variables/Variable';
import { Variables } from '../Variables/Variables';
import { Matrix } from '../Variables/Matrix';
import { SparseMatrix } from '../Variables/SparseMatrix';
import * as assert from 'assert';
import * as Constants from '../Constants';
import { Runtime } from '../Runtime';


describe('Test Matrix', function() {
	// ********************************************************************************
	describe('Variables.loadable empty', function() {
		it(`Should return true`, function() {
			const emptySize = [];
			assert.ok(Variables.loadable(emptySize));
		});
	});


	// ********************************************************************************
	describe('Matrix.makeName', function() {
		const name = 'm0D';
		it(`Should return ${name}`, function() {
			assert.equal((new Matrix(name)).name(), name);
		});
		const freeIndices = [2];
		const fixedIndices = [3,4,5];
		const expectedName = `${name}(:,3,4,5)`;
		it(`Should return ${expectedName}`, function() {
			assert.equal((new Matrix(name, '', freeIndices, fixedIndices, false)).name(), expectedName);
		});
	});


	// ********************************************************************************
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
		const expectedValue = `${values[0]}   ${values[1]}   ${values[2]}   ${values[3]}   ${values[4]}   ${values[5]}   ${values[6]}   ${values[7]}${Constants.ROW_ELEMENTS_SEPARATOR}${values[8]}   ${values[9]}   ${values[10]}   ${values[11]}   ${values[12]}`;

		it(`Should match value '${expectedValue}'`, function() {
			const ans = Matrix.extractValuesLine(value);
			assert.equal(ans, expectedValue);
		});
	});


	// ********************************************************************************
	describe('Matrix.parseAllChildrenOf1DMatrix short', function() {
		const name = 'm1D';
		const values = [0.59733, 0.48898, 0.97283];
const value = `
   ${values[0]}
   ${values[1]}
   ${values[2]}`;
		const freeIndices = [values.length];
		const fixedIndices = [2,4,5];
		const matrix = new Matrix(name, '', freeIndices, fixedIndices, false);
		matrix.parseAllChildrenOf1DMatrix(value, (children: Array<Matrix>) => {
				const expectedChildCount = values.length;

				it(`Should create ${expectedChildCount} child variables`, function() {
					assert.equal(children.length, expectedChildCount);
				});

				for(let i = 0; i !== expectedChildCount; ++i) {
					const val = values[i];
					const child = children[i];
					const expectedName = `${name}(${i+1},${fixedIndices.join(',')})`;
					it(`Should match ${i}-th child value ${val}`, function() {
						assert.equal(child.value(), val);
					});
					it(`Should match name ${expectedName}`, function() {
						assert.equal(child.name(), expectedName);
					});
				}
			}
		);
	});


	// ********************************************************************************
	describe('Matrix.parseAllChildrenOf1DMatrix imaginary', function() {
		const name = 'm1D';
		const values = ['0.0720969 + 0.0720969i', '0.8437697 + 0.8437697i', '0.4532340 + 0.4532340i'];
const value = `
   ${values[0]}
   ${values[1]}
   ${values[2]}`;
		const freeIndices = [values.length];
		const fixedIndices = [2,4,5];
		const matrix = new Matrix(name, '', freeIndices, fixedIndices, false);
		matrix.parseAllChildrenOf1DMatrix(value, (children: Array<Matrix>) => {
				const expectedChildCount = values.length;

				it(`Should create ${expectedChildCount} child variables`, function() {
					assert.equal(children.length, expectedChildCount);
				});

				for(let i = 0; i !== expectedChildCount; ++i) {
					const val = values[i];
					const child = children[i];
					const expectedName = `${name}(${i+1},${fixedIndices.join(',')})`;
					it(`Should match ${i}-th child value ${val}`, function() {
						assert.equal(child.value(), val);
					});
					it(`Should match name ${expectedName}`, function() {
						assert.equal(child.name(), expectedName);
					});
				}
			}
		);
	});


	// ********************************************************************************
	describe('Matrix.parseAllChildrenOf2DMatrix', function() {
		const name = 'm2D';
		const values = [
			['0.0720969 + 0.0720969i', '0.8437697 + 0.8437697i', '0.4532340 + 0.4532340i'],
			['0.3728132 + 0.3728132i', '0.4578918 + 0.4578918i', '0.2673617 + 0.2673617i'],
			['0.3595750 + 0.3595750i', '0.4374822 + 0.4374822i', '0.2433045 + 0.2433045i'],
			['0.2571942 + 0.2571942i', '0.8806884 + 0.8806884i', '0.6366056 + 0.6366056i'],
			['0.0903121 + 0.0903121i', '0.0477089 + 0.0477089i', '0.7309768 + 0.7309768i'],
			['0.0014517 + 0.0014517i', '0.5637025 + 0.5637025i', '0.7037470 + 0.7037470i'],
			['0.8455747 + 0.8455747i', '0.0913287 + 0.0913287i', '0.0333014 + 0.0333014i'],
			['0.3085562 + 0.3085562i', '0.3474878 + 0.3474878i', '0.1476501 + 0.1476501i'],
			['0.2173087 + 0.2173087i', '0.2924523 + 0.2924523i', '0.4891809 + 0.4891809i']
		];
const value =
`Columns 1 through 3:

   ${values[0][0]}   ${values[1][0]}   ${values[2][0]}
   ${values[0][1]}   ${values[1][1]}   ${values[2][1]}
   ${values[0][2]}   ${values[1][2]}   ${values[2][2]}

 Columns 4 through 6:

   ${values[3][0]}   ${values[4][0]}   ${values[5][0]}
   ${values[3][1]}   ${values[4][1]}   ${values[5][1]}
   ${values[3][2]}   ${values[4][2]}   ${values[5][2]}

 Columns 7 through 9:

   ${values[6][0]}   ${values[7][0]}   ${values[8][0]}
   ${values[6][1]}   ${values[7][1]}   ${values[8][1]}
   ${values[6][2]}   ${values[7][2]}   ${values[8][2]}
`;
		const columns = [
			values[0].join(Constants.COLUMN_ELEMENTS_SEPARATOR),
			values[1].join(Constants.COLUMN_ELEMENTS_SEPARATOR),
			values[2].join(Constants.COLUMN_ELEMENTS_SEPARATOR),
			values[3].join(Constants.COLUMN_ELEMENTS_SEPARATOR),
			values[4].join(Constants.COLUMN_ELEMENTS_SEPARATOR),
			values[5].join(Constants.COLUMN_ELEMENTS_SEPARATOR),
			values[6].join(Constants.COLUMN_ELEMENTS_SEPARATOR),
			values[7].join(Constants.COLUMN_ELEMENTS_SEPARATOR),
			values[8].join(Constants.COLUMN_ELEMENTS_SEPARATOR)
		];
		// freeIndices.size == two free indices
		const freeIndices = [columns[0].length, columns.length];
		const fixedIndices = [4,5]; // 4 and 5 are actually 1-based indices
		const matrix = new Matrix(name, '', freeIndices, fixedIndices, false);
		matrix.parseAllChildrenOf2DMatrix(value, (children: Array<Matrix>) => {
				const expectedChildCount = columns.length;

				it(`Should create ${expectedChildCount} child variables`, function() {
					assert.equal(children.length, expectedChildCount);
				});

				for(let i = 0; i !== expectedChildCount; ++i) {
					const val = columns[i];
					const child = children[i];
					const expectedName = `${name}(:,${i+1},${fixedIndices.join(',')})`;
					it(`Should match ${i}-th child value ${val}`, function() {
						assert.equal(child.value(), val);
					});
					it(`Should match name ${expectedName}`, function() {
						assert.equal(child.name(), expectedName);
					});
				}
			}
		);
	});

	describe('Matrix.fetchAllChildren not loadable', function() {
		const name = 'mND';
		const freeIndices = [1, 2, 2, 2];
		const fixedIndices = [];
		OctaveLogger.logToConsole = true;
		const runtime = new Runtime(Constants.DEFAULT_EXECUTABLE, '.');

		const matrix = new Matrix(name, '', freeIndices, fixedIndices, false);
		matrix.fetchAllChildren(runtime, (children: Array<Matrix>) => {
				runtime.disconnect();
				const consumedIndex = freeIndices.length - 1;
				const expectedfreeIndices = freeIndices.slice(0, consumedIndex);
				const expectedChildCount = freeIndices[consumedIndex];
				const expectedValue = expectedfreeIndices.join(Constants.SIZE_SEPARATOR);
				const prefix = (expectedfreeIndices.length !== 0?
					':,'.repeat(expectedfreeIndices.length) : '');
				const suffix = (fixedIndices.length !== 0? ',' + fixedIndices.join(',') : '');

				it(`Should create ${expectedChildCount} child variables`, function() {
					assert.equal(children.length, expectedChildCount);
				});

				for(let i = 0; i !== expectedChildCount; ++i) {
					const child = children[i];
					const expectedName = `${name}(${prefix}${i+1}${suffix})`;
					it(`Should match name ${expectedName}`, function() {
						assert.equal(child.name(), expectedName);
					});
					it(`Should match ${i}-th child value ${expectedValue}`, function() {
						assert.equal(child.value(), expectedValue);
					});
				}
			}
		);
	});

	describe('Matrix.fetchAllChildren', async function() {
		const name = 'm3D';
		// TODOing: make this a 2D matrix test
		const freeIndices = [2, 2];
		const fixedIndices = [];
		const values = [['0.71780', '0.62359'], ['0.57914', '0.98442']];
		const vectors = [
			`[${values[0].join(Constants.ROW_ELEMENTS_SEPARATOR)}]'`,
			`[${values[1].join(Constants.ROW_ELEMENTS_SEPARATOR)}]'`];
		const consumedIndex = freeIndices.length - 1;
		const expectedFreeIndices = freeIndices.slice(0, consumedIndex);
		const expectedGranchildFreeIndices =
			(consumedIndex !== 0? freeIndices.slice(0, consumedIndex - 1) : []);
		const expectedChildCount = freeIndices[consumedIndex];
		const prefix = (expectedFreeIndices.length !== 0?
			':,'.repeat(expectedFreeIndices.length) : '');
		const granchilPrefix = (expectedGranchildFreeIndices.length !== 0?
			':,'.repeat(expectedGranchildFreeIndices.length) : '');
		const suffix = (fixedIndices.length !== 0? ',' + fixedIndices.join(',') : '');

		let runtime;
		let children;
		let grandchildren: Array<Array<Variable>> = [];

		before((done) => {
			OctaveLogger.logToConsole = true;
			runtime = new Runtime(Constants.DEFAULT_EXECUTABLE, '.');
			const cmd = `${name} = [${vectors[0]},${vectors[1]}];`;
			runtime.execute(cmd, () => {
				const matrix = new Matrix(name, '', freeIndices, fixedIndices);
				matrix.fetchAllChildren(runtime, (parsedChildren: Array<Matrix>) => {
						children = parsedChildren;
						for(let i = 0; i !== children.length; ++i) {
							const child = children[i];
							child.listChildren(runtime, 0, 0, (vars: Array<Variable>) => {
								grandchildren.push(vars);
								if(grandchildren.length === children.length) {
									done();
								}
							});
						}
					}
				);
			});
		});

		describe('Matrix.fetchAllChildren load from runtime', function() {
			it(`Should create ${expectedChildCount} child variables`, function() {
				assert.equal(children.length, expectedChildCount);
			});

			for(let i = 0; i !== expectedChildCount; ++i) {
				const val = values[i].join(Constants.COLUMN_ELEMENTS_SEPARATOR);
				const expectedName = `${name}(${prefix}${i+1}${suffix})`;
				it(`Should match name ${expectedName}`, function() {
					const child = children[i];
					assert.equal(child.name(), expectedName);
				});
				it(`Should match ${i}-th child value ${val}`, function() {
					const child = children[i];
					assert.equal(child.value(), val);
				});
			}
		});

		describe('Matrix.listChildren', function() {
			for(let col = 0; col !== expectedChildCount; ++col) {
				for(let row = 0; row !== values.length; ++row) {
					const val = values[col][row];
					const expectedName = `${name}(${granchilPrefix}${row+1},${col+1}${suffix})`;
					it(`Should match name ${expectedName}`, function() {
						const grandchild = grandchildren[col][row];
						assert.equal(grandchild.name(), expectedName);
					});
					it(`Should match child[${col}] grandchild[${row}] value ${val}`, function() {
						const grandchild = grandchildren[col][row];
						assert.equal(grandchild.value(), val);
					});
				}
			}
		});

		after(() => {
			runtime.disconnect();
		});
	});

	describe('SparseMatrix tests', async function() {
		const name = "sm";
		const rows = [1, 2, 3];
		const columns = [4, 5, 6];
		const values = ['7', '8', '9'];
		const expectedIndices = [10, 14, 18]; // find(s)

		let runtime: Runtime;
		let matrix: SparseMatrix;
		let indices: Array<number>;
		let children: Array<SparseMatrix>;

		before((done) => {
			OctaveLogger.logToConsole = true;
			runtime = new Runtime(Constants.DEFAULT_EXECUTABLE, '.');
			const cmd = `${name} = sparse([${rows.join(' ')}], [${columns.join(' ')}], [${values.join(' ')}]);`;
			runtime.execute(cmd, () => {
				const factory = new SparseMatrix();
				factory.loadNew(name, runtime, (sm: SparseMatrix) => {
					matrix = sm;
					matrix.listChildren(runtime, values.length, 0, (vars: Array<SparseMatrix>) => {
						indices = matrix.indices();
						children = vars;
						done();
					});
				});
			});
		});

		describe('Matrix Instance Tests', function() {
			it(`Should match name ${name}`, function() {
				assert.equal(matrix.name(), name);
			});
			it(`Should match indices`, function() {
				for(let index = 0; index !== indices.length; ++index) {
					assert.equal(indices[index], expectedIndices[index]);
				}
			});
		});

		describe('Matrix Children Tests', function() {
			for(let i = 0; i !== values.length; ++i) {
				const val = values[i];
				const expectedName = `${name}(${expectedIndices[i]})`;
				it(`Should match name ${expectedName}`, function() {
					const child = children[i];
					const childName = child.name();
					assert.equal(childName, expectedName);
				});
				it(`Should match ${expectedName} value ${values[i]}`, function() {
					const child = children[i];
					const childValue = child.value();
					assert.equal(childValue, val);
				});
			}
		});

		after(() => {
			runtime.disconnect();
		});
	});
});
