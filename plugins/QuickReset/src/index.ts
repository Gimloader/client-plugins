let startMessage: any = null;
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
    if(api.net.type !== "Colyseus" || !api.net.isHost) return;

    api.net.send("END_GAME", undefined);
    api.net.send("RESTORE_MAP_EARLIER", undefined);

    const gameSession = api.net.room.state.session.gameSession;
    if(gameSession.phase === "countdown") return;

    ignoreNextStart = true;
    const interval = setInterval(() => {
        api.net.send("START_GAME", startMessage);
    }, 100);

    const unsub = gameSession.listen("phase", (phase: string) => {
        if(phase !== "countdown") return;
        
        ignoreNextStart = false;
        clearInterval(interval);
        unsub();
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
    if(api.net.type !== "Colyseus" || !api.net.isHost) return;

    api.net.send("END_GAME", undefined);
    api.net.send("RESTORE_MAP_EARLIER", undefined);
});
