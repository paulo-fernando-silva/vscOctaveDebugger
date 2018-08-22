#!/bin/bash
ffmpeg -y -t 34 -i input.mov -vf fps=2,scale=800:-1:flags=lanczos,palettegen palette.png
ffmpeg -t 34 -i input.mov -i palette.png -filter_complex "fps=2,scale=800:-1:flags=lanczos[x];[x][1:v]paletteuse" output.gif