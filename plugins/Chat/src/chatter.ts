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

enum Op {
    Join,
    Leave,
    Greet,
    Typing,
    NotTyping
}

export default class Chatter {
    private readonly comms = new Comms<string | Op>("Chat");
    private readonly me = api.net.room.state.characters.get(api.stores.network.authId);
    private typing = false;
    private timeout: ReturnType<typeof setTimeout> | null = null;
    private playersTyping: any[] = [];

    constructor(
        private readonly addMessage: (text: string, forceScroll?: boolean) => void,
        private readonly updatePlayersTypingText: (playersTyping: string) => void,
        setEnabled: (enabled: boolean) => void
    ) {
        // redirect the activity feed to the chat
        api.net.on("ACTIVITY_FEED_MESSAGE", (message: any, editFn) => {
            addMessage(`> ${message.message}`);
            editFn(null);
        });

        if(Comms.enabled) {
            this.comms.send(Op.Greet);
            setEnabled(true);
        } else {
            setEnabled(false);
        }

        const joinedPlayers = new Set<string>();

        this.comms.onMessage((message, char) => {
            const removePlayerTyping = () => {
                this.playersTyping = this.playersTyping.filter(c => c !== char);
            };

            if(typeof message === "string") {
                this.addMessage(`${char.name}: ${message}`);
                removePlayerTyping();
            } else {
                switch (message) {
                    case Op.Join:
                        if(joinedPlayers.has(char.id)) return;
                        this.addMessage(`${char.name} connected to the chat`);
                        joinedPlayers.add(char.id);
                        break;
                    case Op.Leave:
                        this.addMessage(`${char.name} left the chat`);
                        joinedPlayers.delete(char.id);
                        removePlayerTyping();
                        this.playersTyping = this.playersTyping.filter(c => c !== char);
                        break;
                    case Op.Greet:
                        addMessage(`${char.name} connected to the chat`);
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
            this.updatePlayersTyping();
        });

        api.onStop(
            api.net.room.state.characters.onRemove((char: any) => {
                joinedPlayers.delete(char.id);
                this.playersTyping = this.playersTyping.filter(c => c !== char);
            })
        );

        this.comms.onEnabledChanged(() => {
            setEnabled(Comms.enabled);
            if(Comms.enabled) {
                addMessage("The chat is active!");
                this.comms.send(Op.Join);
            } else {
                addMessage("The chat is no longer active");
                this.playersTyping = [];
                this.updatePlayersTyping();
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

    private updatePlayersTyping() {
        const names = this.playersTyping.map(player => player.name);

        if(names.length === 0) {
            this.updatePlayersTypingText("");
        } else if(names.length > 3) {
            this.updatePlayersTypingText("Several players are typing...");
        } else if(names.length === 1) {
            this.updatePlayersTypingText(`${names[0]} is typing...`);
        } else {
            this.updatePlayersTypingText(`${names.slice(0, -2).join(", ")} and ${names.at(-1)} are typing.`);
        }
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
            this.timeout = null;
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
