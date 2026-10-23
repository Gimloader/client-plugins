enum Op {
    Ready,
    NotReady,
    Left,
    StartingGame
}

const settings = api.settings.create([
    {
        id: "notReadyOnTabOut",
        title: "Not Ready on Tab Out",
        description: "Automatically switches to not ready when the tab loses focus",
        type: "toggle",
        default: true
    }
]);

const addLabel = api.lib("CharacterLabels");
const Comms = api.lib("Communication");
const comms = new Comms<Op>("ReadyCheck");
const charactersReady = new Map<string, boolean>();

let startingWhenAllReady = false;
let timeout: ReturnType<typeof setTimeout> | null = null;

let ready = false;
const sendReady = () => comms.send(ready ? Op.Ready : Op.NotReady);
const updateReadyTag = () => charactersReady.set(api.stores.network.authId, ready);
const isPreGame = () => api.net.colyseus.state.session.phase === "preGame";

const updateReady = () => {
    sendReady();
    updateReadyTag();
};
const toggleReady = () => {
    ready = !ready;
    updateReady();
};

api.hotkeys.addConfigurableHotkey({
    title: "Toggle Ready",
    category: "Ready Check",
    default: {
        key: "KeyR",
        alt: true,
        shift: true
    }
}, () => {
    if(!Comms.enabled) return;
    toggleReady();
});

if(api.net.isHost) {
    let BottomButton: any;
    const identifier = ".customTeams.characterToTeamMap.forEach(";
    api.rewriter.exposeVar("App-", {
        check: identifier,
        find: /spectator`}`,onClick:\w{1,3}}},(\w{1,3})=/,
        callback: (bb) => BottomButton = bb
    });

    api.rewriter.swapVar("App-", {
        check: identifier,
        find: /\.teamCustomization\)}}:null,(\w{1,3})=/,
        callback: (val, initial) => {
            if(!initial && isPreGame()) api.UI.forceReactUpdate();
            api.onStop(() => {
                if(isPreGame()) api.UI.forceReactUpdate();
            });

            return function(this: any) {
                const [autostart, setAutostart] = api.React.useState(false);

                const result = val.apply(this, arguments);
                const bottomButtons = result.props.children.props.children;
                bottomButtons.push(api.React.createElement(BottomButton, {
                    onClick: () => {
                        setAutostart((prev) => {
                            startingWhenAllReady = !prev;
                            return !prev;
                        });
                    },
                    label: autostart ? "Starting when all ready" : "Manually starting game"
                }));
                return result;
            };
        }
    });
} else {
    api.net.onLoad(() => {
        comms.onEnabledChanged((enabled) => {
            if(!enabled) return;
            updateReady();
        });

        api.onStop(
            api.net.colyseus.state.session.listen("phase", () => {
                ready = false;
                updateReadyTag();
            }, false)
        );

        const onVisibilityChange = () => {
            if(document.visibilityState === "visible" || !settings.notReadyOnTabOut || !ready) return;
            ready = false;
            updateReady();
        };

        document.addEventListener("visibilitychange", onVisibilityChange);
        api.onStop(() => {
            document.removeEventListener("visibilitychange", onVisibilityChange);
        });
    });

    let GameActionButton: any;
    const check = '"aria-label":`Game actions`';
    api.rewriter.exposeVar("App-", {
        check,
        find: /}\)\]}\)}\),(\w{1,3})=\w{1,3}=>/,
        callback: (val) => GameActionButton = val
    });

    api.rewriter.exposeVar("App-", {
        check,
        find: /}\)}\)},(\w{1,3})=\w{1,3}\(\(\)=>{let{session:{cosmosBlocked/,
        callback: (val, initial) => {
            api.patcher.afterReact(val.type, (_, __, result) => {
                const gameActionsProps = result.props.children[0].props.children.props;
                const button = api.React.createElement(GameActionButton, {
                    label: "Ready",
                    onClick: () => {
                        if(!Comms.enabled) return;
                        toggleReady();
                    }
                }, api.React.createElement("i", { className: "far fa-check" }));
                gameActionsProps.children = [button, ...gameActionsProps.children];
            });

            if(!initial && isPreGame()) api.UI.forceReactUpdate();

            api.onStop(() => {
                if(isPreGame()) api.UI.forceReactUpdate();
            });
        }
    });
}

const startIfAllReady = () => {
    if(!startingWhenAllReady || charactersReady.size === 0 || charactersReady.values().some(r => !r) || scheduledStart) return;

    scheduledStart = true;
    comms.send(Op.StartingGame);
    api.UI.notification.info({
        message: "Game starting in 3 seconds..."
    });

    timeout = setTimeout(() => {
        const customTeams: Record<string, string> = {};
        api.stores.session.customTeams.characterToTeamMap.forEach((team, character) => {
            customTeams[character] = team;
        });

        api.net.colyseus.send("START_GAME", {
            customTeams,
            modeType: api.stores.me.preferences.startGameWithMode,
            ownerAsSpectator: api.stores.session.ownerRole === "spectator"
        });
    }, 3000);
};

const destroyLabel = addLabel((char) => {
    if(api.net.colyseus.state.session.gameOwnerId === char.id) return;

    const text = api.stores.phaser.scene.add.text(0, 0, "", {
        fontSize: "normal 25px",
        fontFamily: "'Fugaz One', sans-serif",
        stroke: "#000000",
        strokeThickness: 5,
        align: "center"
    });
    text.setOrigin(0.5, 0);

    return {
        gameObjects: [text],
        update: () => {
            if(api.net.colyseus.state.session.phase === "game") {
                text.visible = false;
                return;
            }
            const ready = charactersReady.get(char.id);
            if(typeof ready === "undefined") {
                text.visible = false;
                return;
            }
            text.visible = true;
            text.text = ready ? "READY" : "NOT READY";
            text.setColor(ready ? "#00FF00" : "#FF0000");
        }
    };
});

let scheduledStart = false;

comms.onMessage((op, char) => {
    if(op === Op.StartingGame) {
        if(char.id !== api.net.colyseus.state.session.gameOwnerId) return;
        scheduledStart = true;
        api.UI.message.info({
            content: "Game starting in 3 seconds, switch to not ready to cancel."
        });
        return;
    }

    if(op === Op.Left) {
        charactersReady.delete(char.id);
        return;
    }

    if(!charactersReady.has(char.id) && !api.net.isHost) {
        sendReady();
    }

    if(scheduledStart && op === Op.NotReady) {
        scheduledStart = false;
        api.UI.notification.info({
            message: `${char.name} canceled start`
        });
        if(timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
    }

    charactersReady.set(char.id, op === Op.Ready);

    if(api.net.isHost) {
        startIfAllReady();
    }
});

api.net.onLoad(() => {
    api.onStop(
        api.net.colyseus.state.session.listen("phase", (phase) => {
            if(phase === "preGame") return;
            scheduledStart = false;
            for(const key of charactersReady.keys()) {
                charactersReady.set(key, false);
            }
        }, false)
    );

    api.onStop(() => {
        comms.send(Op.Left);
        destroyLabel();
        comms.destroy();
    });
});
