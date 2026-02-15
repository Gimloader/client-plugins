import { Ops } from "./consts";
import UI from "./ui";

const settings = api.settings.create([
    {
        id: "transmitTyping",
        type: "toggle",
        title: "Transmit Typing",
        description: "Show other players when you are typing",
        default: true
    }
]);

api.net.onLoad(() => {
    const myId = api.stores.network.authId;

    // redirect the activity feed to the chat
    api.net.on("ACTIVITY_FEED_MESSAGE", (message: any, editFn) => {
        UI.addMessage(`> ${message.message}`);
        editFn(null);
    });

    const me = api.net.room.state.characters.get(myId);
    const Comms = api.lib("Communication");
    const comms = new Comms<string | Ops>("Chat");

    UI.init(async (text: string) => {
        try {
            await comms.send(text);
            UI.addMessage(`${me.name}: ${text}`, true);
        } catch {
            UI.addMessage("Message failed to send", true);
        }
    });

    const joinedPlayers = new Set<string>();

    let typing = false;
    let timeout: ReturnType<typeof setTimeout>;
    let playersTyping: any[] = [];

    function stopTyping() {
        if(!Comms.enabled || !typing) return;
        comms.send(Ops.NotTyping);
        typing = false;
    }

    if(settings.transmitTyping) {
        UI.input.addEventListener("keydown", (e) => {
            if(e.key === "Enter") return;
            if(typing) {
                clearTimeout(timeout);
            } else {
                typing = true;
                comms.send(Ops.Typing);
            }

            timeout = setTimeout(() => stopTyping(), 3000);
        });

        UI.input.addEventListener("blur", () => {
            if(UI.input.disabled) return;
            stopTyping();
        });
    }

    function updatePlayersTyping() {
        const names = playersTyping.map(player => player.name);

        if(names.length === 0) {
            UI.setPlayersTyping("");
        } else if(names.length > 3) {
            UI.setPlayersTyping("Several players are typing...");
        } else if(names.length === 1) {
            UI.setPlayersTyping(`${names[0]} is typing...`);
        } else {
            UI.setPlayersTyping(`${names.slice(0, -2).join(", ")} and ${names.at(-1)} are typing.`);
        }
    }

    comms.onMessage((message, char) => {
        const removeTyping = () => playersTyping = playersTyping.filter(c => c !== char);

        if(typeof message === "string") {
            UI.addMessage(`${char.name}: ${message}`);
            removeTyping();
            updatePlayersTyping();
        } else {
            if(message === Ops.Join) {
                if(joinedPlayers.has(char.id)) return;
                UI.addMessage(`${char.name} connected to the chat`);
                joinedPlayers.add(char.id);
            } else if(message === Ops.Leave) {
                UI.addMessage(`${char.name} left the chat`);
                joinedPlayers.delete(char.id);
                removeTyping();
                updatePlayersTyping();
            } else if(message === Ops.Greet) {
                UI.addMessage(`${char.name} connected to the chat`);
                // resend that we have joined whenever someone joins the chat mid-game
                comms.send(Ops.Join);
                joinedPlayers.add(char.id);
            } else if(message === Ops.Typing) {
                playersTyping.push(char);
                updatePlayersTyping();
            } else if(message === Ops.NotTyping) {
                removeTyping();
                updatePlayersTyping();
            }
        }
    });

    api.onStop(api.net.room.state.characters.onRemove((char: any) => {
        joinedPlayers.delete(char.id);
        playersTyping = playersTyping.filter(c => c !== char);
    }));

    if(Comms.enabled) {
        comms.send(Ops.Greet);
        UI.setEnabled(true);
    } else {
        UI.setEnabled(false);
    }

    comms.onEnabledChanged(() => {
        UI.setEnabled(Comms.enabled);
        if(Comms.enabled) {
            UI.addMessage("The chat is active!");
            comms.send(Ops.Join);
        } else {
            UI.addMessage("The chat is no longer active");
            playersTyping = [];
            updatePlayersTyping();
            if(typing) {
                clearTimeout(timeout);
            }
        }
    });

    function sendLeave() {
        if(!Comms.enabled) return;
        comms.send(Ops.Leave);
    }

    window.addEventListener("beforeunload", sendLeave);
    api.onStop(() => {
        sendLeave();
        comms.destroy();
    });
});
