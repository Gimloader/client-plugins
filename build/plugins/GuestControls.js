/**
 * @name GuestControls
 * @description Allows guests to perform host actions in 2d modes, when the host has this plugin on
 * @author retrozy
 * @version 0.1.2
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/GuestControls.js
 * @webpage https://gimloader.github.io/plugins/GuestControls
 * @needsLib Communication | https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/libraries/Communication.js
 * @gamemode 2d
 * @changelog Updated webpage url
 */

// plugins/GuestControls/src/index.ts
var settings = api.settings.create([
  {
    id: "notification",
    type: "toggle",
    title: "Control Notifications",
    description: "Notify when a guest performs a control",
    default: true
  }
]);
api.net.onLoad(() => {
  const Comms = api.lib("Communication");
  const comms = new Comms("GuestControls");
  const characters = () => [...api.stores.characters.characters.values()];
  comms.onMessage((message, char) => {
    if (!settings.notification || message === 1 /* PluginOff */ || message === 0 /* PluginOn */) return;
    switch (message) {
      case 3 /* EndGame */:
        api.UI.notification.info({ message: `${char.name} ended the game` });
        break;
      case 4 /* ResetToLobby */:
        api.UI.notification.info({ message: `${char.name} reset back to lobby` });
        break;
      case 5 /* AddGameTime */:
        api.UI.notification.info({ message: `${char.name} added game time` });
        break;
      default: {
        const character = characters()[message - 10];
        if (!character) return;
        api.UI.notification.info({ message: `${char.name} kicked ${character.name}` });
      }
    }
  });
  if (api.net.isHost) {
    comms.onEnabledChanged(() => {
      if (!Comms.enabled) return;
      comms.send(0 /* PluginOn */);
    });
    api.onStop(() => {
      if (!Comms.enabled) return;
      comms.send(1 /* PluginOff */);
      comms.destroy();
    });
    comms.onMessage((message) => {
      switch (message) {
        case 2 /* GuestJoined */:
          if (Comms.enabled) comms.send(0 /* PluginOn */);
          break;
        case 3 /* EndGame */:
          api.net.send("END_GAME");
          break;
        case 4 /* ResetToLobby */:
          api.net.send("RESTORE_MAP_EARLIER");
          break;
        case 5 /* AddGameTime */:
          api.net.send("ADD_GAME_TIME");
          break;
        default: {
          const character = characters()[message - 10];
          if (!character) return;
          api.net.send("KICK_PLAYER", {
            characterId: character.id
          });
        }
      }
    });
  } else {
    const { session } = api.stores;
    api.net.room.state.session.listen("phase", (phase) => {
      if (phase !== "game") session.amIGameOwner = false;
    });
    if (Comms.enabled) comms.send(2 /* GuestJoined */);
    comms.onMessage((message) => {
      if (message === 0 /* PluginOn */) {
        session.amIGameOwner = true;
      } else if (message === 1 /* PluginOff */) {
        session.amIGameOwner = false;
      }
    });
    api.onStop(() => {
      session.amIGameOwner = false;
      comms.destroy();
    });
    api.net.on("send:END_GAME", (_, editFn) => {
      comms.send(3 /* EndGame */);
      editFn(null);
    });
    api.net.on("send:RESTORE_MAP_EARLIER", (_, editFn) => {
      comms.send(4 /* ResetToLobby */);
      editFn(null);
    });
    api.net.on("send:ADD_GAME_TIME", (_, editFn) => {
      comms.send(5 /* AddGameTime */);
      editFn(null);
    });
    api.net.on("send:KICK_PLAYER", ({ characterId }, editFn) => {
      const index = characters().findIndex((char) => char.id === characterId) + 10;
      comms.send(index);
      editFn(null);
    });
  }
});
