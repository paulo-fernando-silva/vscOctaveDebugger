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

