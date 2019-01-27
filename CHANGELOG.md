## 0.3.0
* Added support for lazy_index (e.g. find(x))
* Added support for sq_string (e.g. argn)
* Added support for sparse and sparse complex matrices.
* Added support for diagonal and complex diagonal matrices.
* Added support for bool matrix.
* Added logging for output when stepping (e.g. printf).
* Added buffering to very long program output.
* Loading hover expressions as variables when possible.
* Watch expressions now also load as variables if possible.

## 0.2.20
* Fix for launchRequest before configurationDoneRequest.
* Made expression handling more robust.

## 0.2.19
* Extra fix for the terminator string when the last command is a print with no new line.
* Added a separator between the sync command and previous matlab commands.
* Added filtering for 'debug> ' prompt.

## 0.2.18
* Fixed stopping when no breakpoint is set. The runtime wouldn't catch the termination event.
* Made console commands pass through directly to octave.
* Updated extension name in several locations.
* Other minor aesthetic code changes.
* Minor readme changes.
* Set kill to SIGKILL to really kill octave. Just in case...

## 0.2.17
* Fixed bug when clearing breakpoints in file. It would set a single breakpoint.
* Return "undefined" if the watched expression doesn't exist in the current context.

## 0.2.16
* Added matrix and struct size to typename. Displayed when hovering over the name on the variables column.
* Removed the name from the value of the watch variables content.

## 0.2.15
* Renamed the extension. New commits will be done here.

## 0.2.14
* Fixed a bug in the parsing of multi-column vectors/matrices.

## 0.2.13
* Truly fixed the parsing of matrix/vector rows.
* Partially fixed the evaluation of comments. For the time being I'm skipping expressions that don't exist.

## 0.2.12
* Reverted a change that blocks the extension on the new vsc update.

## 0.2.11
* Improved feeback on error. Now a message will be displayed in the console if the extension fails to connect to the octave executable. Syntax errors are also shown in the console.

## 0.2.10
* Made mouse hover expression evaluation always on.
* Fixed the console function evaluation. It was still ignoring the first character.
* Replaced sending quit message by actually killing the process as it sometimes stays spinning behind.

## 0.2.9
* Removed the need for the / in console function evaluation.
* Added a flag to allow visualization of ans.

## 0.2.8
* Fixed a bug that made the vsc UI get stuck if a step response was sent in the middle of a stack request.

## 0.2.7
* Added / to evaluate functions given via debug console.
* Added extra logging, and a new verbose level for extension debug.
* Other minor bug fixes.

## 0.2.6
* Fixed bug that was preventing parsing or matrices with negative values.

## 0.2.5
* Addded support for both matlab and octave languages.
* Made arbitrary expression evaluation on by default. Everything is evaluated except functions because of potential side effects.
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

