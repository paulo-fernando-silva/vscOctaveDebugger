# VS Code Octave Debugger

This extension provides debugging support for code runnable on Octave (might include Matlab code).
This is done by interfacing with octave-cli via stdin/stdout. Do read the changelog to know what's new in this version.
Though this is not necessary to use the extension, I still recommend the following language extensions for [matlab](https://marketplace.visualstudio.com/items?itemName=Gimly81.matlab) and if you really want here's one for [octave](https://marketplace.visualstudio.com/items?itemName=toasty-technologies.octave).


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
* You can set "program" parameter to whatever filename / function you want to debug, e.g.:
    "name": "My configuration",
    "program": "myFunctionOrScript"
    Notice your should remove the .m in Script.m
    The default configuration will show tooltips when you hover the mouse over the parameter names.
* Set breakpoints as needed by clicking on the empty space left of the line numbers.
* Press the 'play' button to start debugging. If you have the default keybindings then F5 should also work.

You can use the buttons, hotkeys, and the debug console to send commands to the debugger.
Since functions are filtered out from evaluation, if you really want to evaluate a function, you have to add a forward slash before it, e.g. `/dbstep`.

Project homepage and source available
[here](https://github.com/paulo-fernando-silva/vscOctaveDebugger.git).
Please submit bugs there too.


## Notes and Known Issues
* There's a bug that makes vscode UI get stuck in a breakpint and only pause is clickable. :(
* The variable ans is used by the debugger internally, so the code should not rely on its value. For that reason ans is also not displayed in the local stack even though it's part of it.


## History :)

I started this project back in December 2017 or January 2018, not quite sure anymore, when I was going through the exercises from the [Andrew Ng's machine learning class](http://openclassroom.stanford.edu/MainFolder/CoursePage.php?course=MachineLearning).
Also check these playlists [Stanford Machine Learning](https://www.youtube.com/watch?v=UzxYlbK2c7E&list=PLA89DCFA6ADACE599), and [Caltech Learning from Data](https://www.youtube.com/watch?v=VeKeFIepJBU&list=PLCA2C1469EA777F9A), and there's plenty more from MIT and others.

Since I was really into vscode but unfortunately there was no octave debugger at the time, and since I have a long commute to work, I decided to use that time to develop this adaptor.
It kind of was an on and off development, but I would say that about 80% of it was done on the train while commuting to work. I really would like to thank Andrew and all the openclassroom and other similar projects (e.g. OpenCourseWare), and of course the people behind vscode. The best editor of its genre out there.


## High-Level Description of Inner Workings

A debug session follows these steps
 * Debug session begin or step
 * Request stack frames comes in
 * Request scopes for selected frame comes in (usually 0, the top frame, but can go up to n where n is the current stack frames depth).
 * Request variables for current open scopes comes in (scope reference is only fetched if > 0) If scope is different than 0, then we need to do a dbup or dbdown before fetching the variables.
 * Request child variables as needed (child variable ref > 0)

More information about vscode Debug Adapters can be found [here](https://code.visualstudio.com/docs/extensionAPI/api-debugging), and information on publishing extensions can be found [here](https://code.visualstudio.com/docs/extensions/publish-extension#_publishers-and-personal-access-tokens).
