# DLDTAS

This is a plugin that allows you to record and playback TASes in Don't Look Down.

## Installation

Click [here](https://gimloader.github.io/install/?installUrl=https://raw.githubusercontent.com/Gimloader/client-plugins/main/plugins/DLDTAS/build/DLDTAS.js) to install the plugin with Gimloader downloaded.

## Usage

When you start a game, a "Start TAS" button will appear in the top left. Clicking this will teleport you to the starting position and open the input table. Check the boxes for left, right and jump to set what the input will be on that frame. Use the right and left arrow to step forwards and backwards (hold shift to move by 5). The currently active frame is highlighted in blue. To play the TAS, hit the play button at the top. You can also import and export TASes as JSON files.

If at any point you want to take manual control of the character, hit the controller button and a countdown will start. Afterwards, all your actions will be recorded until you hit the button again to stop recording.

You can also change the speed of the game with the buttons at the top. Be warned that anything below 1x speed may look jerky.

Also, right clicking on a frame lets you either delete it or insert a blank one before it.

### Lasers

Lasers turn on for 36 frames and then off for 30. They only appear if the host has started the game. When the TAS hits a laser, nothing happens, so its up to you, the TASer, to avoid them. You can change the cycle that the lasers are on by hitting alt + l.