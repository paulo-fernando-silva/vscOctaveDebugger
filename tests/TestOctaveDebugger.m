function TestOctaveDebugger()
%TestOctaveDebugger - tests for VSC octave debugger plugin.
%
% Syntax: TestOctaveDebugger()
%
% Tests breakpoints set in:
% - comments
% - nested functions
% - nested functions defined before the breakpoint
% - nested functions defined after the breakpoint
% - functions defined in other files
% - conditional breakpoints
% Todo:
%
	printf('hello ');
	printf('World\n');
	x = 10;
	y = [1*x 2*x; 3*x 4*x];
	yy = [y y];
	manyRowsMatrix = rand(1000, 1);
	manyColumnsMatrix = rand(3,9,1) * (1 + i);
	complexMatrix = rand(2,2) + rand(2,2)*i;
	testNestedFunction();
	aReallyLongVariableName = 0;
	s11 = struct('a', 1, 'b', 1);
	s12 = struct('a', 1, 'b', 2);
	s21 = struct('a', 2, 'b', 1);
	s22 = struct('a', 2, 'b', 2);
	a = [s11 s12; s21 s22];
end


function testNestedFunctionDefinedBeforeCaller()
	printf('testNestedFunctionDefinedBeforeBreakpoint\n');
end


function testNestedFunctionLevel2()
	printf('testNestedFunctionLevel2\n');
	testNestedFunctionDefinedBeforeCaller();
	testNestedFunctionDefinedAfterCaller();
    SecondaryTestFile();
end


function testNestedFunctionDefinedAfterCaller()
	printf('testNestedFunctionDefinedAfterBreakpoint\n');
end


function testNestedFunction()
	testNestedFunctionLevel2();
	x = 20;
	printf('testNestedFunction\n');
end
