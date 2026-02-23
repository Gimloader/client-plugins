Communication is a runtime library that allows plugins to set up isolated messaging with other clients in the lobby. It does this by "aiming" your character (which fortunately works even when you don't have a weapon) and sending a float that converts to 8 bytes. It's important to note that this method requires headers, identifiers, angle distribution and server approval waiting, so **it can be slow** and you should be mindful of how messages are sent.

Messages are either sent as a single angle, or split into multiple angles. Whenever you can, you want to send a message that fits into as few angles as possible for speed.

The following are sent into a single angle:
- A positive or negative int24 number (-16,777,216 to 16,777,216)
- A string that is 3 characters or less
- A boolean

Everything else is sent as multiple angles, and the time it takes to send depends on how much data you send:
- Any other number (always takes 2 angles)
- An object/array (stringified)
- A string over 3 characters (takes roughly length/7 angles)

## Usage

```js
/**
 * @needsLib Communication | https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/libraries/Communication.js
 */

const Communication = api.lib("Communication");

api.net.onLoad(async () => {
    // Communication converts this string to an identifier under the hood so different plugins don't get in the way of each other
    const comms = new Communication("PluginName");

    // Removes up all onMessage and onEnabledChange callbacks
    api.onStop(comms.destroy);

    comms.onMessage((message, player) => {
        console.log(player.name, "sent a message:", message);
    });

    // Static class property: enabled
    if(Communication.enabled) {
        console.log("Communication is enabled initially");
    }

    // Runs a callback whenever Communication.enabled changes
    comms.onEnabledChange(() => {
        if(Communication.enabled) {
            console.log("Communication is enabled")
            comms.send("Hello world")
        } else {
            console.log("Communication got disabled")
        }
    })

    // `send` is async. It resolves when the server has gotten the angle, and rejects if the game ended when it tried to send the angle
    await comms.send(2);
});
```

## Notes

- You can unfortunately not send messages in the lobby, use `Comms.enabled` to determine if you are in the lobby.
- Do not do `api.net.room.state.characters.onAdd(() => comms.send("Hello new player!"))` because `onAdd` is not necessarily the moment where the player can listen to messages. Instead, create a message for players to send once they have joined the lobby, and respond based on that message.
- If multiple plugins send messages at the same time messages will be queued to avoid messages being dropped by the server, and messages may be delayed.
- When sending strings, characters with codes larger than 255 will be filtered out.
- You can create multiple instances of Communication with different names if you need multiple "channels".
