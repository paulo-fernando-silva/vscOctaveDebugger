# VS Code Octave Debugger

This extension provides debugging support for code runnable on Octave (might include Matlab code).
This is done by interfacing with octave-cli via stdin/stdout.
You need to have octave-cli installed and in your PATH variable as the plugin will run octave-cli.


**Octave Debugger**
This extension supports:
 * *continue*, *step*, *step in*, *step out*
 * *breakpoints*, *conditional breakpoints*,
 * *variable visualization*, *variable editing*
 * *expression evaluation*, *hover expression evaluation*
 * *stack visualization*

This extension does not support drilling down into arrays.
As of now it displays the value of arrays as a string.
If you want to edit the value of an array element you can double click on it, and type the assignment as you would if you were writing code.
That expression will be evaluated and if successful the variable will be updated with the new value.
Improved support for array types is on the TODO list, and it's the next thing I plan to work on.

More information about debugging with Octave can be found
[here](https://www.gnu.org/software/octave/doc/v4.0.0/Debugging.html).


## Using Octave Debugger

* Install the **Octave Debugger** extension in VS Code.
* Open a directory containing the project that you want to debug. This directory should be in octave's code path. (See https://www.gnu.org/software/octave/doc/v4.2.0/Manipulating-the-Load-Path.html)
* Switch to the debug view and press the gear dropdown.
* Add a new debug configuration if one doesn't exist. as follows:
	"type": "OctaveDebugger", and
    "request": "launch",
    "name": "My configuration",
    "program": "${workspaceFolder}/${command:AskForProgramName}"
  You can set program to whatever file or function you want to debug. It should be your program entry point.
* Set breakpoints as needed by clicking on the empty space left of the line numbers.
* Press the green 'play' button to start debugging. If you have the default keybindings then F5 should also work.

Project homepage and source available
[here](https://github.com/paulo-fernando-silva/octave-debugger.git).

## Notes and Known Issues

* The variable ans is used by the debugger internally, so the code should not rely on its value. For that reason ans is also not displayed in the local stack even though it's part of it.
* Debug session will not terminate automatically if we step beyond the last instruction. In that case the user needs to press stop. Only continue will terminate automatically.
