# VS Code Octave Debugger

This extension provides debugging support for Octave code. This is done by interfacing with `octave-cli` via stdin/stdout. Support for running Matlab code is also done through `octave-cli`. Make sure `octave-cli` is in your path environment variable. If you're using windows or scripts with UI elements such as plots and widgets, using `octave-gui` is recommended. See known issues for more details on plots or check this [page](https://github.com/paulo-fernando-silva/vscOctaveDebugger/issues/45). Use

```matlab
    h = figure();
    plot();
    % ...
    waitfor(h);
```

to prevent the script from exiting, allowing continuous debugging of plots. Another option is to put `while(waitforbuttonpress()==0) pause(1) end` at the end of your script. See [here](https://github.com/paulo-fernando-silva/vscOctaveDebugger/issues/52#issuecomment-893771137) for more details.

Do read the changelog to know what's new in this version. This extension has been tested with octave-5.1 and octave-6.1, so everything in between and perhaps more recent versions should also work. If it doesn't, or if a variable is not shown properly, etc, please do let me know over [here](https://github.com/paulo-fernando-silva/vscOctaveDebugger/issues). Do check the known issues on this page.

Though the following is not necessary to use this extension, I recommend the [Octave](https://marketplace.visualstudio.com/items?itemName=toasty-technologies.octave) extension for syntax highlighting. I prefer it over [Matlab](https://marketplace.visualstudio.com/items?itemName=Gimly81.matlab). Nicer colors. The following language extension supports code outline for the focused file [Octave Hacking](https://marketplace.visualstudio.com/items?itemName=apjanke.octave-hacking). We're still missing is the F12 "jump to definition" code navigation. If someone has time and wants to implement it [here's](https://code.visualstudio.com/docs/editor/editingevolved#_go-to-definition) a place to start.


**Octave Debugger**
This extension supports actions:
 * continue, step, step in, step out,
 * breakpoints, conditional breakpoints,
 * variable inspection, variable editing
 * stack navigation and visualization
 * expression evaluation, via console input, watch UI, or mouse hover

The following types are currently supported:
 * Scalar: [floats](https://octave.org/doc/v5.1.0/Single-Precision-Data-Types.html) and [ints](https://octave.org/doc/v5.1.0/Integer-Data-Types.html), the default type being double
 * [Matrix](https://octave.org/doc/v5.1.0/Matrices.html) of all basic types, includes ComplexMatrix/BoolMatrix
 * [DiagonalMatrix/ComplexDiagonalMatrix/PermutationMatrix](https://octave.org/doc/v5.1.0/Diagonal-and-Permutation-Matrices.html)
 * [SparseMatrix/SparseComplexMatrix](https://octave.org/doc/v5.1.0/Sparse-Matrices.html)
 * [Range](https://octave.org/doc/v5.1.0/Ranges.html)
 * [ScalarStruct/Struct](https://octave.org/doc/v5.1.0/Structures.html)
 * [Inline functions](https://octave.org/doc/v5.1.0/Inline-Functions.html) and [function handles](https://octave.org/doc/v5.1.0/Function-Handles.html)
 * [Cell Arrays](https://octave.org/doc/v5.1.0/Cell-Arrays.html)
 * LazyIndex (No docs. This might be an internal type only.)
 * [SqString](https://octave.org/doc/v5.1.0/Escape-Sequences-in-String-Constants.html#Escape-Sequences-in-String-Constants)
 * [Strings](https://octave.org/doc/v5.1.0/Strings.html)
 * UnknownType: represents unknown types as strings.

If a type isn't supported, request it on the [project repository](https://github.com/paulo-fernando-silva/vscOctaveDebugger.git).

![Demo](images/OctaveDebugger.gif)


If you want to edit the value of a variable be it scalar, array, or structure, you can double click on it in the `VARIABLES` view, and type in the new value.
That expression will be evaluated and if successful the variable will be updated with the new value.
You can also submit any command you like through the debug console as if you were typing directly into Octave.

More information about debugging with Octave can be found
[here](https://octave.org/doc/v5.1.0/Debugging.html).


## Using Octave Debugger

* Open the directory containing the project that you want to debug using everyone's favorite editor, visual studio code.
* In the vsCode debug view click the `DEBUG` drop-down box and select `"Add configuration..."`. See animation above.
* Select `"OctaveDebugger"` from the menu that pops up.
* The following the default configuration which will debug the current selected file:

```json
    "type": "OctaveDebugger",
    "request": "launch",
    "name": "Execute selected file.",
    "program": "${file}"
```

* Open the file you wish to debug.
* Set breakpoints as needed.
* Press the `DEBUG` '▷' button or F5 to start debugging.
* Open the `DEBUG CONSOLE` to view any output from your program or to interact with it. Commands will be sent directly to Octave.
Note that `octave-cli` must be installed on your system. You can download it [here](https://www.gnu.org/software/octave/download.html).

## Debug Session Configuration Variables

* Example:

```json
    "type": "OctaveDebugger",
    "request": "launch",
    "name": "My Debug Config - free text",
    "program": "${file}",
    "octave": "/path/to/octave-cli",
    "sourceFolder": "${workspaceFolder}:/usr/local/matlab/code:/opt/local/matlab/more_code",
    "workingDirectory": "${workspaceFolder}"
```

* `"program"` can be anything that can be evaluated, e.g. `"path/to/file.m"`, or `"functionName(value)"`. It defaults to `${file}` which corresponds to the currently focused file. This is a vscode variable - see [variables-reference](https://code.visualstudio.com/docs/editor/variables-reference). However, something like `"functionName('/some/path/file.m')"` probably won't work, as the plugin tries to parse the program directory from this value.
* `"octave"` must point to the location where `"octave-cli"` or `"octave-gui"` is installed. This parameter is optional, and defaults to `"octave-cli"` which assumes that `"octave-cli"` is in your path. If that's not the case make sure to provide the full installation path.
* `"sourceFolder"` is an optional parameter that defaults to `"${workspaceFolder}"`. Basically it is added using `"addpath()"` before starting the `"program"`. More than one directory can be added by separating them with `pathsep()` which defaults to `:`.

For example:

```json
    "program": "foo",
    "sourceFolder": "${workspaceFolder}/A/B/C/"
```

is equivalent to

>
        "program": "${workspaceFolder}/A/B/C/foo.m"

* `"workingDirectory"` is another optional parameter. Octave will switch to this directory before running `"program"`. In the following example  program `"foo"` can exist anywhere under `"${workspaceFolder}"`, but will be executed from `"${workspaceFolder}/A/B/C/"`:

```json
    "program": "foo",
    "sourceFolder": "${workspaceFolder}"
    "workingDirectory": "${workspaceFolder}/A/B/C/"
```

* `"splitFieldnamesOctaveStyle"` this allows struct field names to be almost arbitrary ([details](https://octave.org/doc/v5.1.0/Creating-Structures.html)). This option is not compatible with Matlab and so it's off by default ([details](https://www.mathworks.com/help/matlab/matlab_prog/generate-field-names-from-variables.html)).

## Environment Variables and Octave Arguments

* Consider the following configuration:

```json
    "type": "OctaveDebugger",
    "request": "launch",
    "name": "Environment Check",
    "program": "env.m",
    "octave": "octave-cli",
    "octaveEnvironment": { "FOO": "bar", "VAR": "XPTO" },
    "workingDirectory": "${workspaceFolder}"
```

* `"octaveEnvironment"` is added to the environment when the octave process is created. We can print those environment variables by running the program `env.m` defined as:

```matlab
    printf('FOO: "%s"\n', getenv('FOO'));
    printf('VAR: "%s"\n', getenv('VAR'));
    printf('PATH: "%s"\n', getenv('PATH'));
```

* The same can be achieved using:

```json
    "type": "OctaveDebugger",
    "request": "launch",
    "name": "Environment Check",
    "program": "env.m",
    "octave": "export FOO=bar; octave-cli",
    "shell": true,
    "workingDirectory": "${workspaceFolder}"
```

* `"shell": true,` is this variable's default value, so it can be omitted. If you set it to false, the above configuration will not run as `export FOO=bar; octave-cli` is a shell command, and is not a valid process name.

* Another option is `"octaveArguments": [ "FOO", "bar" ],`. This passes `"FOO"` and `"bar"` as parameters to the octave process. For example, here's another way to manipulate paths:

```json
    "type": "OctaveDebugger",
    "request": "launch",
    "name": "Execute foo in bar",
    "program": "foo.m",
    "octave": "octave-cli",
    "octaveArguments": [ "--path", "bar" ],
    "workingDirectory": "${workspaceFolder}"
```


## Project Homepage
Source available [here](https://github.com/paulo-fernando-silva/vscOctaveDebugger.git).
Please submit bugs there too.


## Known Issues

The following issues will likely not be fixed. For other open issues see [here](https://github.com/paulo-fernando-silva/vscOctaveDebugger/issues).

* ans: Is not displayed in the variables view by default. You can still output it in the console or watch view.
* stdinput when using octave version 5.1 or older: if you're stepping you can't rely on stdinput from your Matlab/Octave code. For example, you can use functions like `pause()`, `input()`, `keyboard()`, etc, as long as it's not during a step over, step into, or step out. To workaround this you can press F5 (continue), and `pause()` will wait for your input in the `DEBUG CONSOLE`. The issue comes from the communication that the plugin does with Octave in order to control execution. When using the console or continuing the execution no such communication exists. So you can step over/into/out using the `DEBUG CONSOLE`, by typing `dbstep` and pressing the `RETURN` key (see [here](https://octave.org/doc/v5.1.0/Debug-Mode.html) for details). Then each new `RETURN` should work as a step directly. This is the way `octave-cli` works by default. Since the `DEBUG CONSOLE` just forwards your commands to `octave-cli` you can interact with it as if it was a normal terminal.
* stdinput when using octave version 5.2 or newer: in this case `pause()`, `kbhit()`, and friends block octave waiting for direct keyboard input. Unfortunately the plugin can't send keypresses directly to the octave process. The plan is to implement a switch to open a background window to run octave-cli so the user can send direct keyboard input to that window. This is tracked in issue [#34](https://github.com/paulo-fernando-silva/vscOctaveDebugger/issues/34). For now if you're using octave 5.2 or newer you should avoid these keyboard functions.
* plotting with qt or other plot frameworks might require you to add an infinite loop at the end of the program being debugged. For example, as mentioned at the top of this page, you can use `h = figure(); plot(); waitfor(h);` or `while(waitforbuttonpress()==0) pause(1) end` which hopefully exits when you press a key but not when you press a mouse button. Using either method will prevent the program from terminating, allowing the debug session to stay alive and the plot to update. The first method will exit when you close the plot, the second method will exit on key press. If the plot doesn't require an update, i.e. no interactive elements such as sliders, then setting a breakpoint on the last program instruction might be enough - just make sure that instruction is after the plot command. This seems to be an issue even when running plots from the cli, see [Getting octave to plot when invoking a function from the command line](https://stackoverflow.com/questions/6843014/getting-octave-to-plot-when-invoking-a-function-from-the-command-line/62340602#62340602) and [Octave: How to prevent plot window from closing itself?](https://stackoverflow.com/questions/52569584/octave-how-to-prevent-plot-window-from-closing-itself).
* Octave will accept arbitrary strings as struct field names. When Octave field names are enabled using `"splitFieldnamesOctaveStyle": true` in the launch options, the only strings that can't be used as struct field names will be strings that match `/\n?  \[\d+,1\] = /`. Using this kind of struct field names with this plugin is not recommended as it might lead to communication issues between the plugin and octave.


## History and Acknowledgements

I started this project back in December 2017 or January 2018, not quite sure anymore, when I was going through the exercises from the [Andrew Ng's machine learning class](http://openclassroom.stanford.edu/MainFolder/CoursePage.php?course=MachineLearning), and other ML resources such as [Stanford Machine Learning](https://www.youtube.com/watch?v=UzxYlbK2c7E&list=PLA89DCFA6ADACE599), [Caltech Learning from Data](https://www.youtube.com/watch?v=VeKeFIepJBU&list=PLCA2C1469EA777F9A), [Deep Learning tutorial](http://ufldl.stanford.edu/tutorial/), and more from MIT and others.

Since vscode is the best editor around, but unfortunately there was no Octave debugger at the time, and since I had a long commute to work, I decided to use that time to develop this plugin.
It was an on and off development process, but I would say that about 80% of it was done on the train while commuting to work or flying around the world. I really would like to thank Andrew and all the openclassroom and other similar projects (e.g. OpenCourseWare), and of course the people behind Octave and vscode.
