# VS Code Octave Debugger

This extension provides debugging support for code runnable on Octave (might include Matlab code).
This is done by interfacing with octave-cli via stdin/stdout.


**Octave Debugger**
This extension supports:
 * *continue*, *step*, *step in*, *step out*
 * *breakpoints*, *conditional breakpoints*,
 * *variable inspection*, *variable editing*
 * *expression evaluation*, *hover expression evaluation*
 * *stack navigation and visualization*

![Demo](images/OctaveDebugger.gif)


If you want to edit the value of a variable be it scalar, array, or structure, you can double click on it in the VARIABLES view, and type in the new value.
That expression will be evaluated and if successful the variable will be updated with the new value.
Not that you should do it, but you can pass other octave commands through like that, e.g. if you have x = 5, and you type '10; y=5', you will set the value of x and create the variable y.

More information about debugging with Octave can be found
[here](https://www.gnu.org/software/octave/doc/v4.0.0/Debugging.html).


## Using Octave Debugger

* Open a directory containing the project that you want to debug.
* Switch to the debug view and press the gear dropdown.
* Click on "debug configuration" and select "OctaveDebugger" from the configuration menu that comes up.
* You can set "program" parameter to whatever file or function you want to debug, e.g.:
    "name": "My configuration",
    "program": "myFunctionOrScript"
* Set breakpoints as needed by clicking on the empty space left of the line numbers.
* Press the 'play' button to start debugging. If you have the default keybindings then F5 should also work.

Project homepage and source available
[here](https://github.com/paulo-fernando-silva/vscOctaveDebugger.git).
Please submit bugs there too.


## Notes and Known Issues

* The variable ans is used by the debugger internally, so the code should not rely on its value. For that reason ans is also not displayed in the local stack even though it's part of it.
* Debug session will not terminate automatically if we step beyond the last instruction. In that case the user needs to press stop. Only continue will terminate automatically.
* When you hover over a function, that function will be evaluated. That can cause side-effects. I left this one because I like to be able to evaluate expressions that do not cause side effects. Might add an option for this in the future. To fix it I need to find out how to distinguish functions in expressions.
* Even though vsc now automatically takes care of splitting fields chunks of 100 children, unfolding a matrix can still take a few milliseconds maybe up to a second. Have to change this to parse the matrix directly instead of asking child by child.


## History :)

I started this project back in December 2017 or January 2018, not quite sure anymore, when I was going through the exercises from the [Andrew Ng's machine learning class](http://openclassroom.stanford.edu/MainFolder/CoursePage.php?course=MachineLearning).
I was really into vscode, but unfortunately there was no debugger at the time.
Since I have a long commute to work, I decided to use that time to develop this interface.
It kind of was an on and off development, but I would say that about 80% of it was done on the train while commuting to work. I really would like to thank Andrew and all the openclassroom and other similar projects (e.g. OpenCourseWare), and of course the people behind vscode. The best editor of its genre out there.


## High-Level Description of Inner Workings

A debug session follows these steps
 * Debug session begin or step
 * Request stack frames comes in
 * Request scopes for selected frame comes in (usually 0, the top frame, but can go up to n where n is the current stack frames depth).
 * Request variables for current open scopes comes in (scope reference is only fetched if > 0) If scope is different than 0, then we need to do a dbup or dbdown before fetching the variables.
 * Request child variables as needed (child variable ref > 0)

More information about vscode Debug Adapters can be found [here](https://code.visualstudio.com/docs/extensionAPI/api-debugging), and information on publishing extensions can be found [here](https://code.visualstudio.com/docs/extensions/publish-extension#_publishers-and-personal-access-tokens).
