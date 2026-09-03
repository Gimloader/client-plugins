Communication is a runtime library that allows plugins to set up isolated messaging with other clients in the lobby. It does this using two methods: "aiming" your character's weapon when in-game, and sending large amounts of stickers when in the lobby. While they are under the same api, there are several important differences bertween them.

## Aiming Messages (sent in-game)
Aiming messages are either sent as a single angle, or split into multiple angles. Whenever you can, you want to send a message that fits into as few angles as possible for speed.

The following are sent into a single angle:
- A positive or negative int24 number (-16,777,216 to 16,777,216)
- A string that is 3 characters or less
- A boolean
- An array with a length of 3 or less of numbers that are all integers between 0 and 255

Everything else is sent as multiple angles, and the time it takes to send depends on how much data you send:
- Any other number (always takes 2 angles)
- An object/array (stringified)
- A string over 3 characters (takes roughly length/7 angles)

An array with a length over 3 of numbers that are all integers between 0 and 255 are sent optimally and are not stringified like other arrays.

## Sticker Messages (sent in lobby)
Sticker messages are much less deterministic than aiming messages. They can send a significantly higher amount of data with less time, however the time they take to send is very inconsistent - it can take less than 100 ms or over 500 ms, even if you have a consistent ping. The amount of data that receiving packets hold is also very inconsistent.

Other than arrays that only include integers between 0 and 255, any object/array is stringified when sending and parsed when receiving, similar to aiming messages.

It is also important to note that your owned stickers have to be fetched, and if you don't have any stickers communication will remain disabled in the lobby.

## Usage

```js
/**
 * @needsLib Communication | https://raw.githubusercontent.com/Gimloader/builds/main/libraries/Communication.js
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

    // `send` is async. It resolves when players have received the angle, and rejects if the game ended or started in the middle of sending the message.
    await comms.send(2);
});
```

## Notes

- Do not do `api.net.colyseus.state.characters.onAdd(() => comms.send("Hello new player!"))` because `onAdd` is not necessarily the moment where the player can listen to messages. Instead, create a message for players to send once they have joined the lobby, and respond based on that message.
- If multiple plugins send messages at the same time messages will be queued to avoid messages being dropped by the server, and messages may be delayed.
- When sending strings, characters with codes larger than 255 will be filtered out.
- You can create multiple instances of Communication with different names if you need multiple "channels".
