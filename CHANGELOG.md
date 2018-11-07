## 0.2.5
* Addded support for both matlab and octave languages.
* Made arbitrary expression evaluation on by default. Everything but functions is evaluated because of side effects.
* Added a new icon.
* Other misc code changes.

## 0.2.3
* Fixed multiroot breakpoints issue.

## 0.2.2
* Fixed the bug that was preventing the debug session from terminating on step.

## 0.2.1
* Added logging for output from the program. I only noticed now that it wasn't supported. Output in orange.
* Add logging for debug communications with octave. This is output in white. Set "trace": true in your launch.json.
* Set server side logging to off by default as this is only useful for development, e.g. unit tests.


## 0.2.0
* Implemented variable fetching in chunks of 100 elements, e.g. 10x10 matrix will be completely fetched. while a 1000x1 will be fetched for selected ranges of elements. Matrices 2D or less with more than 100 elements can still be fetched in a single operation by setting prefetchCount in launch.json. A prefetchCount of 10 would load any 2D matrix up to 1000 elements (10 chunks of 100). The default is 1.

## 0.1.7
* Refactored the matrix code. Now it retrives the value once, and then parses the children from that value. This is only done for two (#indices) dimensional matrices, independent of their size in each dimension.
* struct has also been separated from matrix. Now it uses the old matrix code. I'm assuming it'll never have as many elements as a matrix.


## 0.1.6
* Fix for issue #7 "scope list children fails when answer contains new lines"

## 0.1.5
* Refactored the matrix fetch to allow only fetching a predefined number of elements. That way the amount of time taken to obtain the contents of a matrix or sub-matrix can be somewhat controlled. A prefetchCount = 1 is the fastest, but also only shows elements when at the leaf level. A prefetchCount = 2 ~ 99 costs about the same as the cost is mainly dependent on the pipe communication.

## 0.1.4
* Added a variable to launch.json to set the source directory so to add to octave's path every time you debug. That way the source can be located anywhere on disk. Also added an option to set octave's executable, in case you don't have it on your path. Updated documentation.

## 0.1.3
* Updated demo animation.

## 0.1.2
* Fixed stack navigation (update locals).

## 0.1.1
* Updated documentation.

## 0.1.0
* Created project.

