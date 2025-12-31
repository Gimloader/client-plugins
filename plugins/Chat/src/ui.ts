import { maxLength } from "./consts";
import styles from "./styles.css";

api.UI.addStyles(styles);

api.hotkeys.addConfigurableHotkey({
    category: "Chat",
    title: "Open Chat",
    preventDefault: false,
    default: {
        key: "KeyY"
    }
}, (e) => {
    if(document.activeElement !== document.body) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    UI.input?.focus();
});

// Get the formatter that is used for formatting the activity feed
type Formatter = (message: { inputText: string }) => string;
let format: Formatter | null = null;

api.rewriter.exposeVar("App", {
    check: ">%SPACE_HERE",
    find: /}\);const (\S+)=.=>.{0,175}>%SPACE_HERE%/,
    callback: (formatter) => format = formatter
});

export default class UI {
    static send: (message: string) => Promise<void>;
    static element: HTMLElement;
    static messageWrapper: HTMLElement;
    static messageContainer: HTMLElement;
    static input: HTMLInputElement;
    static maxLength = 100;
    static history: HTMLElement[] = [];
    static enabled = false;

    static init(send: (message: string) => Promise<void>) {
        UI.send = send;

        UI.element = document.createElement("div");
        UI.element.id = "gl-chat";

        const spacer = document.createElement("div");
        spacer.id = "chat-spacer";
        UI.element.appendChild(spacer);

        UI.messageWrapper = document.createElement("div");
        UI.messageWrapper.id = "chat-messages-wrap";
        UI.element.appendChild(UI.messageWrapper);

        UI.messageContainer = document.createElement("div");
        UI.messageContainer.id = "chat-messages";
        UI.messageWrapper.appendChild(UI.messageContainer);

        UI.input = UI.createInput();
        UI.element.appendChild(UI.input);
        document.body.appendChild(UI.element);
        api.onStop(() => UI.element.remove());

        const blurInput = () => UI.input?.blur();
        document.addEventListener("click", blurInput);
        api.onStop(() => document.removeEventListener("click", blurInput));
    }

    static createInput() {
        const input = document.createElement("input");
        input.maxLength = maxLength;
        input.disabled = true;
        input.placeholder = "...";

        input.addEventListener("click", (e) => e.stopPropagation());

        input.addEventListener("keydown", async (e) => {
            e.stopPropagation();
            if(e.key.length === 1 && e.key.charCodeAt(0) >= 256) e.preventDefault();

            if(e.key === "Escape") {
                input.blur();
                return;
            }

            if(e.key === "Enter") {
                const message = input.value;
                if(message.length === 0) return;

                input.value = "";
                input.placeholder = "Sending...";
                input.disabled = true;

                await UI.send(message);
                if(!UI.enabled) return;

                input.disabled = false;
                input.placeholder = "...";
                input.focus();

                return;
            }
        });

        return input;
    }

    static addMessage(message: string, forceScroll = false) {
        const element = document.createElement("div");
        if(format) {
            // The formatter includes a full html sanitizer so there is no need to sanitize the messages
            element.innerHTML = format({ inputText: message });
        } else {
            element.innerText = message;
        }

        const wrap = UI.messageWrapper;
        const shouldScroll = wrap.scrollHeight - wrap.scrollTop - wrap.clientHeight < 1;

        UI.history.push(element);
        UI.messageContainer.appendChild(element);
        if(UI.history.length > UI.maxLength) {
            UI.history.shift()?.remove();
        }

        if(shouldScroll || forceScroll) wrap.scrollTop = wrap.scrollHeight;
    }

    static setEnabled(enabled: boolean) {
        UI.enabled = enabled;

        if(enabled) {
            UI.input.disabled = false;
            UI.input.placeholder = "...";
        } else {
            UI.input.disabled = true;
            UI.input.placeholder = "Chat not available in lobby";
        }
    }
}
