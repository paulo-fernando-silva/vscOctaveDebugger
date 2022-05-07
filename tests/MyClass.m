classdef MyClass < handle
	properties
		M = [];
		N = 0;
	end
	methods
		function o = MyClass(N)
			if nargin > 0
				o.N = 0;
				o.M = zeros(N, 1);
			end
		end

		function add(o, x)
			if o.used() < o.size()
				o.M(++o.N) = x;
			end
		end

		function n = get(o, i)
			if i <= o.used()
				n = o.M(i);
			else
				n = NaN;
			end
		end

		function n = used(o)
			n = o.N;
		end

		function n = size(o)
			n = size(o.M, 1);
		end

		function b = full(o)
			b = o.used() == o.size();
		end
	end
end
