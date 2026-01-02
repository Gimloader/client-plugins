import { Ops } from "./consts";
import UI from "./ui";

api.net.onLoad(() => {
    const myId = api.stores.network.authId;

    // redirect the activity feed to the chat
    api.net.on("ACTIVITY_FEED_MESSAGE", (message: any, editFn) => {
        UI.addMessage(`> ${message.message}`);
        editFn(null);
    });

    const me = api.net.room.state.characters.get(myId);
    const Comms = api.lib("Communication");
    const comms = new Comms("Chat");

    UI.init(async (text: string) => {
        await comms.send(text);
        UI.addMessage(`${me.name}: ${text}`, true);
    });

    const joinedPlayers = new Set<string>();

    comms.onMessage<string | Ops>((message, char) => {
        if(typeof message === "string") {
            UI.addMessage(`${char.name}: ${message}`);
        } else {
            if(message === Ops.Join) {
                if(joinedPlayers.has(char.id)) return;
                UI.addMessage(`${char.name} connected to the chat`);
                joinedPlayers.add(char.id);
            } else if(message === Ops.Leave) {
                UI.addMessage(`${char.name} left the chat`);
            } else if(message === Ops.Greet) {
                UI.addMessage(`${char.name} connected to the chat`);
                // resend that we have joined whenever someone joins the chat mid-game
                comms.send(Ops.Join);
                joinedPlayers.add(char.id);
            }
        }
    });

    comms.onEnabled(immediate => {
        UI.setEnabled(true);

        if(immediate) {
            // if we join mid-game request for others to re-send their join message
            comms.send(Ops.Greet);
        } else {
            UI.addMessage("The chat is active!");
            comms.send(Ops.Join);
        }
    });

    comms.onDisabled(immediate => {
        UI.setEnabled(false);

        if(!immediate) {
            UI.addMessage("The chat is no longer active");
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
