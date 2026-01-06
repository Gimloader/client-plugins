let startMessage: any = null;
let ignoreNextStart = false;

api.net.on("send:START_GAME", (message) => {
    if(ignoreNextStart) return;
    startMessage = message;
});

export function reset() {
    if(api.net.type !== "Colyseus" || !api.net.isHost) return;

    api.net.send("END_GAME");
    api.net.send("RESTORE_MAP_EARLIER");

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
}

export function exitToLobby() {
    if(api.net.type !== "Colyseus" || !api.stores.session.amIGameOwner) return;

    api.net.send("END_GAME");
    api.net.send("RESTORE_MAP_EARLIER");
}

api.hotkeys.addConfigurableHotkey({
    category: "Quick Reset",
    title: "Reset",
    preventDefault: false,
    default: {
        key: "KeyR",
        alt: true
    }
}, reset);

api.hotkeys.addConfigurableHotkey({
    category: "Quick Reset",
    title: "Exit to Lobby",
    preventDefault: true,
    default: {
        key: "KeyL",
        alt: true
    }
}, exitToLobby);

api.net.onLoad(() => {
    api.commands.addCommand({
        text: "QuickReset: Restart Game",
        keywords: ["reset"]
    }, reset);

    api.commands.addCommand({
        text: "QuickReset: Exit to Lobby",
        keywords: ["restart", "reset"]
    }, exitToLobby);
});
