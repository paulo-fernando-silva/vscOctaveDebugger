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

		let runtime;
		let str: String;

		before((done) => {
			OctaveLogger.logToConsole = false;
			runtime = new Runtime(Constants.DEFAULT_EXECUTABLE, '.');
			const cmd = `${name} = "${value}";`;
			runtime.evaluateAsLine(cmd, (output: string) => {
				factory.loadNew(name, "string", runtime, (s: String) => {
					str = s;
					done();
				});
			})
		});

		describe('String load from runtime', function() {
			it(`Should have value ${expectedValue} child variables`, function() {
				assert.equal(str.value(), expectedValue);
			});
		});

		after(() => {
			runtime.disconnect();
		});
	});
});
