const Comms = api.lib("Communication");
type Character = Gimloader.Schema.ObjectSchema<Gimloader.Schema.CharacterState>;

const settings = api.settings.create([
    {
        id: "transmitTyping",
        type: "toggle",
        title: "Transmit Typing",
        description: "Show other players when you are typing",
        default: true
    },
    {
        id: "streamMessages",
        type: "toggle",
        title: "Stream Messages",
        description: "Show messages being typed out instead of waiting for them to be fully recieved",
        default: true
    },
    {
        id: "showSkins",
        type: "toggle",
        title: "Show Skins",
        description: "Display player skins next to their messages in chat",
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

// Get the formatter that is used for formatting the activity feed
type Formatter = (message: { inputText: string }) => string;

let format: Formatter | null = null;

api.rewriter.exposeVar("App", {
    check: ">%SPACE_HERE",
    find: /}\);const (\S+)=.=>.{0,175}>%SPACE_HERE%/,
    callback: (formatter) => format = formatter
});

function parseSkin(skin?: string) {
    if(!skin) return;
    try {
        const id = JSON.parse(skin).id;
        return id.replace("character_", "");
    } catch {}
}

interface Message {
    formatted: boolean;
    text: string;
    senderSkin?: string;
}

export default class Chatter {
    private readonly comms = new Comms<string | Op>("Chat");
    private readonly me = api.net.state.characters.get(api.stores.network.authId)!;
    private typing = false;
    private timeout: ReturnType<typeof setTimeout> | null = null;
    playersTyping = $state<Character[]>([]);
    enabled = $state(Comms.enabled);
    messages = $state<Message[]>([]);
    sending = $state(false);
    showSkins = $state(settings.showSkins);

    private addMessage(text: string, forceScroll = false, skin?: string) {
        if(format) text = format({ inputText: text });

        this.scroll(forceScroll);
        if(this.messages.length === 500) this.messages.splice(0, 1);

        this.messages.push({
            senderSkin: parseSkin(skin),
            text,
            formatted: Boolean(format)
        });
    }

    constructor(private readonly scroll: (force: boolean) => void) {
        // redirect the activity feed to the chat
        api.net.on("ACTIVITY_FEED_MESSAGE", (message, editFn) => {
            this.addMessage(`> ${message.message}`, true);
            editFn(null);
        });

        if(Comms.enabled) {
            this.comms.send(Op.Greet);
        }

        settings.listen("showSkins", (value) => this.showSkins = value);

        const joinedPlayers = new Set<string>();

        this.comms.onStringStream(async (chunks, char) => {
            if(!settings.streamMessages) return;

            // Mark the player as not typing
            this.playersTyping = this.playersTyping.filter(c => c !== char);

            // Get the reactive message object and append to it
            this.scroll(false);
            this.messages.push({
                senderSkin: parseSkin(char.appearance.skin),
                text: `${char.name}: `,
                formatted: false
            });
            const message = this.messages[this.messages.length - 1];

            // dprint-ignore-start
            for await (const chunk of chunks) {
            // dprint-ignore-end
                this.scroll(false);
                message.text += chunk;
            }

            // Format the message after it has been fully received
            if(!format) return;
            message.text = format({ inputText: message.text });
            message.formatted = true;
        });

        this.comms.onMessage((message, char) => {
            const removePlayerTyping = () => {
                this.playersTyping = this.playersTyping.filter(c => c !== char);
            };

            if(typeof message === "string") {
                if(!settings.streamMessages) {
                    this.addMessage(`${char.name}: ${message}`, false, char.appearance.skin);
                    removePlayerTyping();
                }
            } else {
                switch (message) {
                    case Op.Join:
                        if(joinedPlayers.has(char.id)) return;
                        this.addMessage(`${char.name} connected to the chat`, false, char.appearance.skin);
                        joinedPlayers.add(char.id);
                        break;
                    case Op.Leave:
                        this.addMessage(`${char.name} left the chat`);
                        joinedPlayers.delete(char.id);
                        removePlayerTyping();
                        break;
                    case Op.Greet:
                        this.addMessage(`${char.name} connected to the chat`, false, char.appearance.skin);
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
            api.net.state.characters.onRemove((char) => {
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
        this.sending = true;

        try {
            await this.comms.send(text);
            this.addMessage(`${this.me.name}: ${text}`, true, this.me.appearance.skin);
        } catch {
            this.addMessage("Message failed to send", true);
        }

        this.sending = false;

        this.typing = false;
        if(this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
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
        if(!this.typing) return;
        if(!Comms.enabled || !this.typing) return;
        this.comms.send(Op.NotTyping);
        this.typing = false;
    }
}
