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
    const comms = new Comms<number | number[]>("GuestControls");

    const characters = () => [...api.stores.characters.characters.values()];

    comms.onMessage((message, char) => {
        if(!settings.notification || message === Op.PluginOff || message === Op.PluginOn) return;

        if(Array.isArray(message)) {
            api.UI.notification.info({ message: `${char.name} started the game` });
            return;
        }

        switch (message) {
            case Op.EndGame:
                api.UI.notification.info({ message: `${char.name} ended the game` });
                break;
            case Op.ResetToLobby:
                api.UI.notification.info({ message: `${char.name} reset back to lobby` });
                break;
            case Op.AddGameTime:
                api.UI.notification.info({ message: `${char.name} added game time` });
                break;
            default: {
                const character = characters()[message - 10];
                if(!character) return;
                api.UI.notification.info({ message: `${char.name} kicked ${character.name}` });
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
            if(Array.isArray(message)) {
                const customTeams: Record<string, string> = {};
                if(message.length > 0) {
                    for(let i = 0; i < message.length; i += 2) {
                        const [index, team] = message.slice(i, i + 2);
                        const id = characters()[index]?.id;
                        if(!id) return;
                        customTeams[id] = team.toString();
                    }
                }

                api.net.colyseus.send("START_GAME", {
                    customTeams,
                    // @ts-expect-error Incorrect type
                    modeType: api.stores.me.preferences.startGameWithMode,
                    ownerAsSpectator: api.stores.session.ownerRole === "spectator"
                });

                return;
            }

            switch (message) {
                case Op.GuestJoined:
                    if(Comms.enabled) comms.send(Op.PluginOn);
                    break;
                case Op.EndGame:
                    api.net.colyseus.send("END_GAME");
                    break;
                case Op.ResetToLobby:
                    api.net.colyseus.send("RESTORE_MAP_EARLIER");
                    break;
                case Op.AddGameTime:
                    api.net.colyseus.send("ADD_GAME_TIME");
                    break;
                default: {
                    const character = characters()[message - 10];
                    if(!character) return;
                    api.net.colyseus.send("KICK_PLAYER", {
                        characterId: character.id
                    });
                }
            }
        });
    } else {
        const { session } = api.stores;

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

        api.net.colyseus.on("send:START_GAME", (data, editFn) => {
            const teams: number[] = [];
            for(const [playerId, team] of Object.entries<string>(data.customTeams)) {
                const index = characters().findIndex((char) => char.id === playerId);
                teams.push(index, Number(team));
            }

            comms.send(teams);
            editFn(null);
        });

        api.net.colyseus.on("send:END_GAME", (_, editFn) => {
            comms.send(Op.EndGame);
            editFn(null);
        });

        api.net.colyseus.on("send:RESTORE_MAP_EARLIER", (_, editFn) => {
            comms.send(Op.ResetToLobby);
            editFn(null);
        });

        api.net.colyseus.on("send:ADD_GAME_TIME", (_, editFn) => {
            comms.send(Op.AddGameTime);
            editFn(null);
        });

        api.net.colyseus.on("send:KICK_PLAYER", ({ characterId }, editFn) => {
            const index = characters().findIndex(char => char.id === characterId) + 10;
            comms.send(index);
            editFn(null);
        });
    }
});
