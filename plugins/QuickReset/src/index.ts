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

api.hotkeys.addConfigurableHotkey({
    category: "Quick Reset",
    title: "Exit to Lobby",
    preventDefault: true,
    default: {
        key: "KeyL",
        alt: true
    }
}, () => {
    if(api.net.type !== "Colyseus" || !GL.net.isHost) return;

    api.net.send("END_GAME");
    api.net.send("RESTORE_MAP_EARLIER");
});