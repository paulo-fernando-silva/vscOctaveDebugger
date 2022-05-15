% string: single long string, since it's less than 100 chars should still load
str0 = "This is a very long string 0123456789 abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ";
% string: two childs, less than 100 chars per child, should load completely
str1 = [
	"this is a string",
	"this is another string"
];
% sq_string: two childs, less than 100 chars per child, should load completely
str2 = char (
	"an apple",
	"two pears"
);
% sq_string: three childs, less than more than 100 chars, but less then 100 chars per child.
% Should load on demand.
str3 = char (
	str2(1,:),
	str2(2,:),
	str0
);
% string: more than 100 chars should only load on demand
str4 = strcat(str0, str0);
% string: more than 100 chars per child, should only load on demand
str5 = [
	str4,
	str4
];
% should load value and children
str6 = [
	repmat('0', 1, 33)
	repmat('1', 1, 33)
	repmat('2', 1, 33)
];
% should not load but should load children on request
str7 = [
	repmat('0', 1, 34)
	repmat('1', 1, 34)
	repmat('2', 1, 34)
];
% should load value and children: special case for spaces
str8 = [
	repmat(' ', 1, 33)
	repmat(' ', 1, 33)
	repmat(' ', 1, 33)
];
% should not load but should load children on request: special case for spaces
str9 = [
	repmat(' ', 1, 34)
	repmat(' ', 1, 34)
	repmat(' ', 1, 34)
];
% should not load value or children, should only load children range on request.
str10 = [
	repmat('0', 1, 101)
	repmat('1', 1, 101)
];
% should not load value or children, should only load children range on request.
str11 = [
	repmat('0', 1, 101)
];
% We're done here. This is only to give me a line to set a breakpoint
disp("the end");
