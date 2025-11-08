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
    const Communication = api.lib("Communication");
    const comms = new Communication("Chat");

    UI.init(async (text: string) => {
        await comms.send(text);
        UI.addMessage(`${me.name}: ${text}`, true);
    });

    api.onStop(comms.onMessage((message: string | number, char: any) => {
        if(typeof message === "string") {
            UI.addMessage(`${char.name}: ${message}`);
        } else {
            if(message === Ops.Join) {
                UI.addMessage(`${char.name} connected to the chat`);
            } else if(message === Ops.Leave) {
                UI.addMessage(`${char.name} left the chat`);
            } else if(message === Ops.Greet) {
                UI.addMessage(`${char.name} connected to the chat`);
                // resend that we have joined whenever someone joins the chat mid-game
                comms.send(Ops.Join);
            }
        }
    }));

    // if we join mid-game request for others to re-send their join message
    if(api.net.room.state.session.phase === "game") {
        comms.send(Ops.Greet);
    }

    api.onStop(api.net.room.state.session.listen("phase", (phase: string) => {
        UI.setEnabled(phase === "game");
    }));

    api.onStop(api.net.room.state.session.listen("phase", (phase: string) => {
        if(phase === "game") {
            UI.addMessage("The chat is active!");
            comms.send(Ops.Join);
        } else {
            UI.addMessage("The chat is no longer active");
        }
    }, false));

    window.addEventListener("beforeunload", () => {
        comms.send(Ops.Leave);
    });

    api.onStop(() => comms.send(Ops.Leave));
});
