const Comms = api.lib("Communication");

const settings = api.settings.create([
    {
        id: "transmitTyping",
        type: "toggle",
        title: "Transmit Typing",
        description: "Show other players when you are typing",
        default: true
    }
]);

const enum Op {
    Join,
    Leave,
    Greet,
    Typing,
    NotTyping
}

interface Message {
    type: "plaintext" | "formatted";
    message: string;
}

// Get the formatter that is used for formatting the activity feed
type Formatter = (message: { inputText: string }) => string;

let format: Formatter | null = null;

api.rewriter.exposeVar("App", {
    check: ">%SPACE_HERE",
    find: /}\);const (\S+)=.=>.{0,175}>%SPACE_HERE%/,
    callback: (formatter) => format = formatter
});

export default class Chatter {
    private readonly comms = new Comms<string | Op>("Chat");
    private readonly me = api.net.room.state.characters.get(api.stores.network.authId);
    private typing = false;
    private timeout: ReturnType<typeof setTimeout> | null = null;
    playersTyping = $state<any[]>([]);
    enabled = $state(Comms.enabled);
    messages = $state<Message[]>([]);
    sending = $state(false);

    private addMessage(text: string, shouldFormat?: boolean, forceScroll = false) {
        if(format && shouldFormat) text = format({ inputText: text });
        if(this.messages.length === 100) this.messages.splice(0, 1);
        this.messages.push({
            type: shouldFormat ? "formatted" : "plaintext",
            message: text
        });
        this.scroll(forceScroll);
    }

    constructor(private readonly scroll: (force: boolean) => void) {
        // redirect the activity feed to the chat
        api.net.on("ACTIVITY_FEED_MESSAGE", (message: any, editFn) => {
            this.addMessage(`> ${message.message}`, true);
            editFn(null);
        });

        if(Comms.enabled) {
            this.comms.send(Op.Greet);
        }

        const joinedPlayers = new Set<string>();

        this.comms.onMessage((message, char) => {
            const removePlayerTyping = () => {
                this.playersTyping = this.playersTyping.filter(c => c !== char);
            };

            if(typeof message === "string") {
                this.addMessage(`${char.name}: ${message}`, false);
                removePlayerTyping();
            } else {
                switch (message) {
                    case Op.Join:
                        if(joinedPlayers.has(char.id)) return;
                        this.addMessage(`${char.name} connected to the chat`, false);
                        joinedPlayers.add(char.id);
                        break;
                    case Op.Leave:
                        this.addMessage(`${char.name} left the chat`, false);
                        joinedPlayers.delete(char.id);
                        removePlayerTyping();
                        break;
                    case Op.Greet:
                        this.addMessage(`${char.name} connected to the chat`, false);
                        // resend that we have joined whenever someone joins the chat mid-game
                        this.comms.send(Op.Join);
                        joinedPlayers.add(char.id);
                        break;
                    case Op.Typing:
                        this.playersTyping.push(char);
                        break;
                    case Op.NotTyping:
                        removePlayerTyping();
                        break;
                }
            }
        });

        api.onStop(
            api.net.room.state.characters.onRemove((char: any) => {
                joinedPlayers.delete(char.id);
                this.playersTyping = this.playersTyping.filter(c => c !== char);
            })
        );

        this.comms.onEnabledChanged(() => {
            this.enabled = Comms.enabled;
            if(Comms.enabled) {
                this.addMessage("The chat is active!", false);
                this.comms.send(Op.Join);
            } else {
                this.addMessage("The chat is no longer active", false);
                this.playersTyping = [];
                if(this.typing && this.timeout) {
                    clearTimeout(this.timeout);
                }
            }
        });

        window.addEventListener("beforeunload", this.sendLeave);
        api.onStop(() => {
            this.sendLeave();
            this.comms.destroy();
            window.removeEventListener("beforeunload", this.sendLeave);
        });
    }

    private sendLeave() {
        if(!Comms.enabled) return;
        this.comms.send(Op.Leave);
    }

    async send(text: string) {
        try {
            await this.comms.send(text);
            this.addMessage(`${this.me.name}: ${text}`, true);
        } catch {
            this.addMessage("Message failed to send", true);
        }
    }

    sendTyping() {
        if(!settings.transmitTyping) return;

        if(this.typing) {
            if(this.timeout) clearTimeout(this.timeout);
        } else {
            this.typing = true;
            this.comms.send(Op.Typing);
        }

        this.timeout = setTimeout(() => this.stopTyping(), 3000);
    }

    stopTyping() {
        if(!Comms.enabled || !this.typing) return;
        this.comms.send(Op.NotTyping);
        this.typing = false;
    }
}
