/**
 * @name QuickReset
 * @description Quickly lets you restart 2d gamemodes
 * @author TheLazySquid
 * @version 0.4.2
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/QuickReset.js
 * @webpage https://gimloader.github.io/plugins/QuickReset
 * @gamemode 2d
 * @changelog Updated webpage url
 */

// plugins/QuickReset/src/index.ts
var startMessage = null;
var ignoreNextStart = false;
api.net.on("send:START_GAME", (message) => {
  if (ignoreNextStart) return;
  startMessage = message;
});
function reset() {
  if (api.net.type !== "Colyseus" || !api.net.isHost) return;
  api.net.send("END_GAME");
  api.net.send("RESTORE_MAP_EARLIER");
  const gameSession = api.net.room.state.session.gameSession;
  if (gameSession.phase === "countdown") return;
  ignoreNextStart = true;
  const interval = setInterval(() => {
    api.net.send("START_GAME", startMessage);
  }, 100);
  const unsub = gameSession.listen("phase", (phase) => {
    if (phase !== "countdown") return;
    ignoreNextStart = false;
    clearInterval(interval);
    unsub();
  });
}
function exitToLobby() {
  if (api.net.type !== "Colyseus" || !api.stores.session.amIGameOwner) return;
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
export {
  exitToLobby,
  reset
};
