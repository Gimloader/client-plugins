enum Op {
    PluginOn,
    PluginOff,
    GuestJoined,
    EndGame,
    ResetToLobby,
    AddGameTime
}

const settings = api.settings.create([
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
    const comms = new Comms<number>("GuestControls");

    const characters = () => [...api.stores.characters.characters.values()];

    comms.onMessage((message, char) => {
        if(!settings.notification || message === Op.PluginOff || message === Op.PluginOn) return;

        switch (message) {
            case Op.EndGame:
                api.notification.info({ message: `${char.name} ended the game` });
                break;
            case Op.ResetToLobby:
                api.notification.info({ message: `${char.name} reset back to lobby` });
                break;
            case Op.AddGameTime:
                api.notification.info({ message: `${char.name} added game time` });
                break;
            default: {
                const character = characters()[message - 10];
                if(!character) return;
                api.notification.info({ message: `${char.name} kicked ${character.name}` });
            }
        }
    });

    if(api.net.isHost) {
        comms.onEnabledChanged(() => {
            if(!Comms.enabled) return;
            comms.send(Op.PluginOn);
        });

        // Resend when anyone joins
        api.onStop(() => {
            if(!Comms.enabled) return;
            comms.send(Op.PluginOff);
            comms.destroy();
        });

        comms.onMessage(message => {
            switch (message) {
                case Op.GuestJoined:
                    if(Comms.enabled) comms.send(Op.PluginOn);
                    break;
                case Op.EndGame:
                    api.net.send("END_GAME");
                    break;
                case Op.ResetToLobby:
                    api.net.send("RESTORE_MAP_EARLIER");
                    break;
                case Op.AddGameTime:
                    api.net.send("ADD_GAME_TIME");
                    break;
                default: {
                    const character = characters()[message - 10];
                    if(!character) return;
                    api.net.send("KICK_PLAYER", {
                        characterId: character.id
                    });
                }
            }
        });
    } else {
        const { session } = api.stores;

        api.net.room.state.session.listen("phase", (phase: string) => {
            if(phase !== "game") session.amIGameOwner = false;
        });

        if(Comms.enabled) comms.send(Op.GuestJoined);

        comms.onMessage(message => {
            if(message === Op.PluginOn) {
                session.amIGameOwner = true;
            } else if(message === Op.PluginOff) {
                session.amIGameOwner = false;
            }
        });

        api.onStop(() => {
            session.amIGameOwner = false;
            comms.destroy();
        });

        api.net.on("send:END_GAME", (_, editFn) => {
            comms.send(Op.EndGame);
            editFn(null);
        });

        api.net.on("send:RESTORE_MAP_EARLIER", (_, editFn) => {
            comms.send(Op.ResetToLobby);
            editFn(null);
        });

        api.net.on("send:ADD_GAME_TIME", (_, editFn) => {
            comms.send(Op.AddGameTime);
            editFn(null);
        });

        api.net.on("send:KICK_PLAYER", ({ characterId }, editFn) => {
            const index = characters().findIndex(char => char.id === characterId) + 10;
            comms.send(index);
            editFn(null);
        });
    }
});
