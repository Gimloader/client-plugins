/**
 * @name QuickReset
 * @description Quickly lets you restart 2d gamemodes
 * @version 0.2.4
 * @author TheLazySquid
 * @webpage https://gimloader.github.io/plugins/quickreset
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/plugins/QuickReset.js
 */

let startMessage = null;
let ignoreNextStart = false;

api.net.on("send:START_GAME", (message) => {
    if(ignoreNextStart) return;
    startMessage = message;    
});

api.hotkeys.addConfigurableHotkey({
    category: "Quick Reset",
    title: "Reset",
    preventDefault: false,
    default: {
        key: "KeyR",
        alt: true
    }
}, () => {
    if(api.net.type !== "Colyseus" || !GL.net.isHost) return;

    api.net.send("END_GAME");
    api.net.send("RESTORE_MAP_EARLIER");

    ignoreNextStart = true;
    let interval = setInterval(() => {
        api.net.send("START_GAME", startMessage);
    }, 100);

    let unsub = api.net.room.state.session.gameSession.listen("phase", (phase) => {
        if(phase === "countdown") {
            ignoreNextStart = false;
            clearInterval(interval);
            unsub();
        }
    });
});