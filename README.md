# MotionWalk Impact JS Line of Sight plugin

## Summary

This is my first impact.js plugin. This plugin can show a "Line of Sight" effect in your impact.js games.

## Requirements
-The game must be tile based.
-There should be a player.
-The player must be in the middle of the screen.

## Example image

![][image-1]

## Installation

1. Put the plugin file here: `lib/plugins/mw_los.js`
2. Require `'plugins.mw_los'`.

## Usage

Initialize:
```
`this.los = new ig.MW_LineOfSight(
 // player must be set
 player          :   this.player,
 // Debug settings
 debug           :   true,
 // Color settings
 startColor      :   'rgba(0, 0, 0, 0)',
 endColor        :   'rgba(0, 0, 0, 0.55)',
 startRadius     :   ig.system.height/4,
 endRadius       :   ig.system.height/2,
 strokeColor     :   'rgba(255, 0, 255, 1)'
});
```
`
Then put these codes in the `draw()` loop of the game:

```
`if (this.los) 
 this.los.drawLOS();
 //this.los.drawForwardEdges();    // Draw the edges, normally don't show it
 this.los.drawCalculatedEdges();   // Draw the lights and shadow
}
```
`
## Parameters

* **player (Required)** *the player instance* 
* **debug** *debug mode true/false*
* ** startColor** *start color for RadialGradient*
* ** startRadius** *start radius for RadialGradient*
* ** endColor** *end color for RadialGradient*
* ** endRadius** *end radius for RadialGradient*
* ** startColor** *stroke color for viewable area, dont't define it if you don't want the stroke*

# The MIT License (MIT)
## Copyright (c) 2015 MotionWalk Studio

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


[image-1]:	https://raw.githubusercontent.com/wiki/eastecho/impact-los/github.png "Example image"