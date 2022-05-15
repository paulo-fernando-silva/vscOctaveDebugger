import { OctaveLogger } from '../OctaveLogger';
import { String } from '../Variables/String';
import * as assert from 'assert';
import * as Constants from '../Constants';
import { Runtime } from '../Runtime';


describe('Test String', function() {
	describe('String.setString/getString', async function() {
		const factory = new String();
		const name = 'str';
		const value = "foo\\nbar";
		const expectedValue = "foo\nbar";
		// Set a very large string of 100 0's and 100 1's
		const setZerosAndOnes = `${name} = [ repmat('0', 1, 100); repmat('1', 1, 100) ];`;
		const child0Value = '0'.repeat(100);
		const child1Value = '1'.repeat(100);
		const child0Name = `${name}(1,:)`;
		const child1Name = `${name}(2,:)`;

		let runtime;
		let line: String;
		let array: String;
		let children: String[];

		before((done) => {
			OctaveLogger.logToConsole = false;
			runtime = new Runtime(Constants.DEFAULT_EXECUTABLE, [], {}, ['.'], '.', true, false);

			const cmd = `${name} = "${value}";`;
			runtime.evaluateAsLine(cmd, (output: string) => {
				factory.loadNew(name, "string", runtime, (s: String) => {
					line = s;
					runtime.execute(setZerosAndOnes);
					factory.loadNew(name, "string", runtime, (s: String) => {
						array = s;
						array.listChildren(runtime, 0, 0, (vars: String[]) => {
							children = vars;
							done();
						});
					});
				});
			})
		});

		describe('String load children', function() {
			it(`Name should be ${name}`, function() {
				assert.equal(line.name(), name);
			});
			it(`Should have value ${expectedValue} child variables`, function() {
				assert.equal(line.value(), expectedValue);
			});
			it(`Children should not be null`, function() {
				assert(children !== null);
			});
			it(`Should have 2 children`, function() {
				assert.equal(children.length, 2);
			});
			it(`Child 0's name should be ${child0Name}`, function() {
				assert.equal(children[0].name(), child0Name);
			});
			it(`Child 0's value should be ${child0Value[0]} ${child0Value.length}x`, function() {
				assert.equal(children[0].value(), child0Value);
			});
			it(`Child 1's name should be ${child1Name}`, function() {
				assert.equal(children[1].name(), child1Name);
			});
			it(`Child 1's value should be ${child1Value[0]} ${child1Value.length}x`, function() {
				assert.equal(children[1].value(), child1Value);
			});
		});

		after(() => {
			runtime.disconnect();
		});
	});
});
