# VS Code Octave Debugger

This extension provides debugging support for Octave code (might include Matlab code).
This is done by interfacing with octave-cli via stdin/stdout. Do read the changelog to know what's new in this version.
Though this is not necessary to use the extension, I still recommend the following language extensions for [matlab](https://marketplace.visualstudio.com/items?itemName=Gimly81.matlab) and [octave](https://marketplace.visualstudio.com/items?itemName=toasty-technologies.octave).


**Octave Debugger**
This extension supports actions:
 * continue, step, step in, step out,
 * breakpoints, conditional breakpoints,
 * variable inspection, variable editing
 * stack navigation and visualization
 * expression evaluation, via console input, watch UI, or mouse hover

The following types are currently supported:
 * Scalar: [floats](https://octave.org/doc/v4.0.0/Single-Precision-Data-Types.html) and [ints](https://octave.org/doc/v4.0.0/Integer-Data-Types.html), the default type being double
 * [Matrix](https://octave.org/doc/v4.0.0/Matrices.html) of all basic types, includes ComplexMatrix/BoolMatrix
 * [DiagonalMatrix/ComplexDiagonalMatrix/PermutationMatrix](https://octave.org/doc/v4.2.1/Diagonal-and-Permutation-Matrices.html)
 * [SparseMatrix/SparseComplexMatrix](https://octave.org/doc/v4.0.3/Sparse-Matrices.html)
 * [Range](https://octave.org/doc/v4.0.0/Ranges.html)
 * [ScalarStruct/Struct](https://octave.org/doc/v4.0.0/Structures.html)
 * [Inline functions](https://octave.org/doc/v4.0.0/Inline-Functions.html) and [function handles](https://octave.org/doc/v4.4.0/Function-Handles.html)
 * [Cell Arrays](https://octave.org/doc/v4.0.3/Cell-Arrays.html)
 * LazyIndex
 * SqString
 * UnknownType: represents unknown types as strings.

If a type isn't supported request it on the [project repository](https://github.com/paulo-fernando-silva/vscOctaveDebugger.git).

![Demo](images/OctaveDebugger.gif)


If you want to edit the value of a variable be it scalar, array, or structure, you can double click on it in the VARIABLES view, and type in the new value.
That expression will be evaluated and if successful the variable will be updated with the new value.
You can also submit any command you like through the debug console as if it you were typing directly into Octave.

More information about debugging with Octave can be found
[here](https://octave.org/doc/v5.1.0/Debugging.html).


## Using Octave Debugger

* Open a directory containing the project that you want to debug.
* In the debug view click the DEBUG drop-down box and select "Add configuration..."
* Select "OctaveDebugger" from the menu that pops up.
* The following is an example of a minimal configuration:

>
    "type": "OctaveDebugger",
    "request": "launch",
    "name": "My Hello World",
    "program": "printf('Hello World');"

* Set breakpoints as needed.
* Press the DEBUG '▷' button or F5 to start debugging.
* Open the "DEBUG CONSOLE" to view any output from your program or to interact with it. Commands will be sent directly to octave.
Note that octave-cli must be instaleld on your system. You can download it [here](https://www.gnu.org/software/octave/download.html).

## Understanding the Debug Session Configuration

* Example configuration:

>
    "type": "OctaveDebugger",
    "request": "launch",
    "name": "My Debug Config - free text",
    "program": "file_or_function_name_and_parameters(foo,bar)",
    "octave": "/path/to/octave-cli",
    "sourceFolder": "${workspaceFolder}",
    "workingDirectory": "${workspaceFolder}",
    "autoTerminate": true

* "octave" must point to the location where "octave-cli" is installed. This parameter is optional, and defaults to "octave-cli" which assumes that "octave-cli" is in your path. If that's not the case make sure to provide the full installation path.
* "sourceFolder" is an optional parameter that defaults to "${workspaceFolder}". Basically it is added using "addpath()" before starting the "program".

For example:

>
        "program": "foo",
        "sourceFolder": "${workspaceFolder}/A/B/C/"

is equivalent to

>
        "program": "${workspaceFolder}/A/B/C/foo.m"

* "workingDirectory" is another optional parameter. Octave will switch to this directory before running "program". This allows you to create configurations like:

>
    "program": "foo",
    "sourceFolder": "${workspaceFolder}"
    "workingDirectory": "${workspaceFolder}/A/B/C/"

    where program "foo" can exist anywhere under "${workspaceFolder}", but will be executed from "${workspaceFolder}/A/B/C/"

* "program" can be anything that can be evaluated, e.g. a "path/to/file.m", or "functionName(value)".
* "autoTerminate" Setting this to false will allow the program to continue executing after the last line of code is excuted. This is useful if you're running UI elements with callbacks and you want to continue debugging after the end of the program code.

## Project Homepage
Source available [here](https://github.com/paulo-fernando-silva/vscOctaveDebugger.git).
Please submit bugs there too.


## Known Issues

* ans: Is not displayed in the variables view by default. You can still output it in the console of watch view.
* stdinput: Currently if you're stepping you can't rely on stdinput from your matlab/octave code. You can use pause, as long as it's not during a "step over", "step into" and "step out". That is, if you press F5 (continue) the pause will wait for your input in the DEBUG CONSOLE. Same for input(), keyboard(), etc. In the limit you can also step over/into/out using the DEBUG CONSOLE, by typing dbstep and enter. Then each new enter should work as a step directly. This is the way octave-cli works by default. Since the DEBUG CONSOLE just forwards your commands to octave-cli you can interact with it as if it was a normal terminal.


## History :)

I started this project back in December 2017 or January 2018, not quite sure anymore, when I was going through the exercises from the [Andrew Ng's machine learning class](http://openclassroom.stanford.edu/MainFolder/CoursePage.php?course=MachineLearning).
Also check these playlists [Stanford Machine Learning](https://www.youtube.com/watch?v=UzxYlbK2c7E&list=PLA89DCFA6ADACE599), [Caltech Learning from Data](https://www.youtube.com/watch?v=VeKeFIepJBU&list=PLCA2C1469EA777F9A), [Deep Learning tutorial](http://ufldl.stanford.edu/tutorial/), and there's plenty more from MIT and others.

Since I was really into vscode but unfortunately there was no Octave debugger at the time, and since I have a long commute to work, I decided to use that time to develop this adapter.
It kind of was an on and off development, but I would say that about 80% of it was done on the train while commuting to work. I really would like to thank Andrew and all the openclassroom and other similar projects (e.g. OpenCourseWare), and of course the people behind vscode. The best editor of its genre out there.


## High-Level Description of Inner Workings

A debug session follows these steps
 * Debug session begin or step
 * Request stack frames comes in
 * Request scopes for selected frame comes in (usually 0, the top frame, but can go up to n where n is the current stack frames depth).
 * Request variables for current open scopes comes in (scope reference is only fetched if > 0) If scope is different than 0, then we need to do a dbup or dbdown before fetching the variables.
 * Request child variables as needed (child variable ref > 0)

More information about vscode Debug Adapter Protocol can be found here [DAP](https://microsoft.github.io/debug-adapter-protocol/overview) and the [API](https://code.visualstudio.com/docs/extensionAPI/api-debugging), and information on publishing extensions can be found [here](https://code.visualstudio.com/docs/extensions/publish-extension#_publishers-and-personal-access-tokens).
Funny fact, I noticed too late that the name of the plugin is not only spelled wrong but also it doesn't follow the expected "no caps and words separated by hyphens" pattern. :p