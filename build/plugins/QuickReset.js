/**
 * @name QuickReset
 * @description Quickly lets you restart 2d gamemodes
 * @author TheLazySquid
 * @version 0.3.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/QuickReset.js
 * @webpage https://gimloader.github.io/plugins/quickreset
 * @gamemode 2d
 */

// plugins/QuickReset/src/index.ts
var startMessage = null;
var ignoreNextStart = false;
api.net.on("send:START_GAME", (message) => {
  if (ignoreNextStart) return;
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
  if (api.net.type !== "Colyseus" || !api.net.isHost) return;
  api.net.send("END_GAME", void 0);
  api.net.send("RESTORE_MAP_EARLIER", void 0);
  ignoreNextStart = true;
  const interval = setInterval(() => {
    api.net.send("START_GAME", startMessage);
  }, 100);
  const unsub = api.net.room.state.session.gameSession.listen("phase", (phase) => {
    if (phase === "countdown") {
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
  if (api.net.type !== "Colyseus" || !api.net.isHost) return;
  api.net.send("END_GAME", void 0);
  api.net.send("RESTORE_MAP_EARLIER", void 0);
});
