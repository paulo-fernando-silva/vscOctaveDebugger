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


	int8_ = int8(1); uint8_ = uint8(1);
	int16_ = int16(1); uint16_ = uint16(1);
	int32_ = int32(1); uint32_ = uint32(1);
	int64_ = int64(1); uint64_ = uint64(1);
	float_ = single(1); double_ = double(1);
	b = logical(1);
	permMat = eye(3)(1:3,:);
	printf('hello ');
	printf('World\n');	
	x = 10;
	y = [1*x 2*x; 3*x 4*x];
	yy = [y y];
	sm = sparse([1 2 3], [4 5 6], [-10.2, 5.0, 101])
	csm = sparse([1 2 3], [4 5 6], [-10.2 + i, 5.0, 101])
	lsm = sparse(1:400, 201:600, magic(20)(:)); 
	dg_mt = diag([1:10]);
	cplx_dg_mt = diag([1:10]+i);
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
