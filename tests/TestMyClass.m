N = 10;
mc = MyClass(N);

for i = 1:N
	mc.add(i * i);
end

assert(mc.full());

for i = 1:mc.used()
	printf("mc[%d] = %d\n", i, mc.get(i));
end

printf("the end");
