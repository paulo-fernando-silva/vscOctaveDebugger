## 0.5.12
* Bump braces from 3.0.2 to 3.0.3.

## 0.5.11
* Added support for classdefs inside packages like: +MYPakcage/MyClassdef.m
* Minor readme tweak.
* Minor cleanup in the package.json.

## 0.5.10
* Bump webpack from 5.38.1 to 5.76.0

## 0.5.9
* Fix classdef name parsing for classes in +packages, e.g. package.MyType

## 0.5.8
* Fix sorting VARIABLES view. Only name is used, not indices. Assumes stable sort.
* Fix error on hover over a :

## 0.5.7
* Added sorting to the VARIABLES view.

## 0.5.6
* Fix stack fetch - lambdas are now supported.

## 0.5.5
* Tweaked hover evaluation to use current selected stack frame.

## 0.5.4
* Bump terser from 5.7.0 to 5.14.2

## 0.5.3
* Fix debugger not starting because of more than 1 invalid breakpoint (again).

## 0.5.2
* Fix debugger not starting because of invalid breakpoints.

## 0.5.1
* Added support for loading "long" strings by chunks.

## 0.5.0
* Added support for classdef types (breakpoints are not supported yet in octave)

## 0.4.29
* Fixed Cell loading.

## 0.4.28
* Fixed performance of HOVER and WATCH variable fetch. Now it'll fetch large variables by chunks.

## 0.4.27
* Fixed hover over 1:variable, now it'll display the value of the whole expression. Still outputs error to console on evaluation of non defined ranges.
* Updated packages due to CVE-2021-44906

## 0.4.26
* Added support to load multi-dimensional matrices.

## 0.4.25
* Added matrix/array visualization in WATCH view.
* Fixed free indices that are 1 in matrix types.
* Changed the vector size visualization to display 1xN or Nx1 instead of just N.

## 0.4.24
* Fixed addFolders to use pathsep instead of a hardcoded :.
* Updated mocha used in unit tests to remove depend-bot warning.

## 0.4.23
* Added some language aliases, to take into consideration other ways of writing octave.

## 0.4.22
* Removed vsce from development dependencies,
* Added support for --interactive mode. Allows octave to continue executing when the script exited even on error. Rigth now it still needs to be set manually via octave arguments. See readme for details.

## 0.4.21
* Extended autoTerminate to support interaction beyond script termination. Now using program:"" and autoTerminate:false enters a sort of interactive mode, where commands can be sent to octave via de DEBUG CONSOLE, and the internal octave state will still show in the VARIABLES, and WATCH views.

## 0.4.20
* Fixed readme.md typos.

## 0.4.19
* Fixed issue with breakpoints set in files contained in the "workingDirectory".
* Tweaked the readme.md
* Updated a couple of packages.

## 0.4.18
* Removed tar dependency.
* Set ${file} as the default program to run.
* Tweaked the readme a bit.

## 0.4.17
* Updated vsce, typescript, ts-loader, webpack, and webpack-cli.

## 0.4.16
* Bump css-what from 5.0.0 to 5.0.1

## 0.4.15
* Added support for passing environment variables and program arguments to octave.

## 0.4.14
* Bumped "elliptic": ">=6.5.4", "lodash": "^4.17.21", "vsce": "^1.88.0", "webpack-cli": "^3.3.10"

## 0.4.13
* Small readme tweak.
* Bump ssri from 6.0.1 to 6.0.2

## 0.4.12
* Tested octave 6.2.0 and updated the readme file with some more information on how to properly run the plugin when using plots.

## 0.4.11
* Updated y18n dependency.

## 0.4.10
* Updated "elliptic": ">=6.5.4"
* Updated readme.

## 0.4.9
* Fix issue #40, i.e. now the plugin works with octave >5.1. Though pause() and kbhit() are still issues.

## 0.4.8
* Fix for issue #37 gave origin to issue #38, hopefully, this fixes it. ^^

## 0.4.7
* Fixed issue #37, escaped paths.

## 0.4.6
* Update "serialize-javascript": ">=3.1.0"

## 0.4.5
* Update elliptic package to 6.5.3 (indirect dependency)

## 0.4.4
* Bump lodash from 4.17.14 to 4.17.19.

## 0.4.3
* Fix remove_all_breakpoint_in_file: unable to find function ex1 #33

## 0.4.2
* Fixed security warnings given by the github bot.
* Updated the octave language suggestions in readme.

## 0.4.1
* Added support for long strings.

## 0.4.0
* Added CommandLists which allow to buffers commands before sending them to Octave. This costs more than immediate mode for small commands, but for scopes with lots of variables provides gains of about 40~50% in variable fetching. Tested with scopes of about 30 variables.
* Removed log messages that I believe aren't necessary.
* Tweaked I/O between Octave and vsc.
* Fixed "which" called without parameters bug when evaluating expressions.
* Added confirmation for conditional breakpoints.
* Improved struct field name parsing. Now it supports Matlab and Octave styles. Matlab is used by default because Octave allows for arbitrary strings which is more generic so less compatible. Also, completely arbitrary strings are not supported.
* Updated readme, and fixed typos.
* Improved String support. Before only sq_strings were supported, now both string and sq_string are supported. Still needs support for lazy loading of large strings.
* Made UnknownType load when possible.
* Extension changed enough to deserve a minor version bump. Completely arbitrary. :)

## 0.3.19
* Removed the theme color. Doesn't look as I imagined. Have to figure out how to use it.
* Webpacked the project. Should load faster, and maybe be a bit snappier.
* Fixed WATCH errors for undefined variables.
* Removed leading spaces in matrix hover evaluation.
* Other smaller misc changes.

## 0.3.18
* Tweaked the .vscodeignore. This removes unnecessary files, and should make the extension smaller and allow faster loading.
* Pressing return/enter in the DEBUG CONSOLE no longer prints synchronization tags.
* Fix a bug that would prevent stdio from the script, e.g. printf("foo"), from being output to the DEBUG CONSOLE as it would be mixed in the variable fetching and therefore silently ignored. Now commands have a begin and end to separate their output from other output.
* Fixed Permutation, Complex Diagonal, and Diagonal Matrix types parsing. It has been broken for over 1 year, but apparently noone noticed.
* Fixed bug with wrong HOVER evaluation, i.e. if you hover 'var', evaluate would eval "'var".
* Fixed bug where evaluate errors would consume begin/end tags. Now if an error occurs the input handlers will skip their capture if it's passed their command number.

## 0.3.17
* Updated readme.
* Fixed support for multiple source directories.

## 0.3.16
* Updated readme.
* Added autoTerminate to launch.json to control if Octave terminates automatically when the last program instruction is executed. Default value is true, i.e. Octave process will be terminated after the last program line is executed. Setting this to false will allow the program to continue executing.
* Fixes issue #25 basename fails when path is not a path, but includes a path-like structure.
* Fixes issue with https-proxy-agent.

## 0.3.15
* Updated readme.
* Fixed a long-standing issue between stepping and pause, input, keyboard, and other input commands. Now pause can be used, but one needs to "continue/F5" the execution over those commands, or dbstep and multiple enters in the "DEBUG CONSOLE" as this bypasses the vsc-octave-debugger control commands.
* Added option "logFilename" for debugging the extension.
* Added option "verbose" for debugging the extension.
* Simplified the configuration. Now a minimal config is only the "program" and "name".
* Refactored the logger. Now user commands show immediately in the DEBUG CONSOLE. Stepping still shows the output only at the end. Will likely change this in the near future.

## 0.3.14
* Security update. Upgraded lodash to version 4.17.13 or later.

## 0.3.13
* Upgrade querystringify to version 2.0.0

## 0.3.12
* Updated packages that had vulnerabilities.

## 0.3.11
* Escaped variable names as these might contain special characters.
* Avoided loading type again when loading new variable instances.

## 0.3.10
* Small fix to the variable response. Now it wont stop if you step before the variable listing is complete. Needs refactoring as it's way too slow for certain complex codebases.
* Added a bit of extra error logging.

## 0.3.9
* Added Support for "pause" execution.
* Fixed pausing issue that would break debugging session.

## 0.3.8
* Now UnknownType never loads the value to prevent loading large data types.
* Added support for cell type.

## 0.3.7
* Fixed loading large structs.

## 0.3.6
* Added support for function handles.
* Added a variable workingDirectory to the program arguments. If not set defaults to program directory, if no program directory is given defaults to sourceDirectory, otherwise defaults to the filesystem root.
* Fixed scalar struct loading children. Now children are loaded as variables which avoids loading very large matrices. Struct has the same issue but will require more work to fix. Next release.

## 0.3.5
* Extended matrix support to all basic types.
* Extended sparse matrix support to extra basic types.

## 0.3.4
* Fixed readme.

## 0.3.3
* Created an UnknownType, and make sure of its size allows loading.
* Replaced the old evaluate and waitSend by a new execute, and evaluate respectively.
* Added support for uint8 matrix type.
* Added support for int and float (complex) scalar types.
* Added support for bool type.
* Added support for permutation matrices.
* Added support for inline functions.

## 0.3.2
* Added Range support.
* Fixed a bug by which children of subclasses of matrix would be matrices instead of the subclass.

## 0.3.1
* Added a new line to lines output to the console.

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
* Added a separator between the sync command and previous Matlab commands.
* Added filtering for 'debug> ' prompt.

## 0.2.18
* Fixed stopping when no breakpoint is set. The runtime wouldn't catch the termination event.
* Made console commands pass through directly to Octave.
* Updated extension name in several locations.
* Other minor aesthetic code changes.
* Minor readme changes.
* Set kill to SIGKILL to really kill Octave. Just in case...

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
* Improved feedback on error. Now a message will be displayed in the console if the extension fails to connect to the Octave executable. Syntax errors are also shown in the console.

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
* Added support for both Matlab and Octave languages.
* Made arbitrary expression evaluation on by default. Everything is evaluated except functions because of potential side effects.
* Added a new icon.
* Other misc code changes.

## 0.2.3
* Fixed multiroot breakpoints issue.

## 0.2.2
* Fixed the bug that was preventing the debug session from terminating on step.

## 0.2.1
* Added logging for output from the program. I only noticed now that it wasn't supported. Output in orange.
* Add logging for debug communications with Octave. This is output in white. Set "trace": true in your launch.json.
* Set server side logging to off by default as this is only useful for development, e.g. unit tests.


## 0.2.0
* Implemented variable fetching in chunks of 100 elements, e.g. 10x10 matrix will be completely fetched. while a 1000x1 will be fetched for selected ranges of elements. Matrices 2D or less with more than 100 elements can still be fetched in a single operation by setting prefetchCount in launch.json. A prefetchCount of 10 would load any 2D matrix up to 1000 elements (10 chunks of 100). The default is 1.

## 0.1.7
* Refactored the matrix code. Now it retrieves the value once, and then parses the children from that value. This is only done for two (#indices) dimensional matrices, independent of their size in each dimension.
* struct has also been separated from matrix. Now it uses the old matrix code. I'm assuming it'll never have as many elements as a matrix.


## 0.1.6
* Fix for issue #7 "scope list children fails when answer contains new lines"

## 0.1.5
* Refactored the matrix fetch to allow only fetching a predefined number of elements. That way the amount of time taken to obtain the contents of a matrix or sub-matrix can be somewhat controlled. A prefetchCount = 1 is the fastest, but also only shows elements when at the leaf level. A prefetchCount = 2 ~ 99 costs about the same as the cost is mainly dependent on the pipe communication.

## 0.1.4
* Added a variable to launch.json to set the source directory so to add to Octave's path every time you debug. That way the source can be located anywhere on disk. Also added an option to set Octave's executable, in case you don't have it on your path. Updated documentation.

## 0.1.3
* Updated demo animation.

## 0.1.2
* Fixed stack navigation (update locals).

## 0.1.1
* Updated documentation.

## 0.1.0
* Created project.
