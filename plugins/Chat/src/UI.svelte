<script lang="ts">
    import { tick } from "svelte";
    import Chatter from "./chatter";
    import globals from "./globals.svelte";

    // Get the formatter that is used for formatting the activity feed
    type Formatter = (message: { inputText: string }) => string;
    let format: Formatter | null = null;

    api.rewriter.exposeVar("App", {
        check: ">%SPACE_HERE",
        find: /}\);const (\S+)=.=>.{0,175}>%SPACE_HERE%/,
        callback: (formatter) => format = formatter
    });

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
        input.focus();
    });

    interface Message {
        type: "plaintext" | "formatted";
        message: string;
    }

    let messages = $state<Message[]>([]);
    let inputText = $state("");
    let sending = $state(false);
    let wrap: HTMLDivElement;
    let input: HTMLInputElement;

    let inputPlaceholder = $derived.by(() => {
        if(!globals.enabled) return "Chat not available in lobby";
        if(sending) return "Sending...";
        return "...";
    });

    function addMessage(text: string, shouldFormat?: boolean, forceScroll = false) {
        if(format && shouldFormat) text = format({ inputText: text });
        if(messages.length === 100) messages.splice(0, 1);
        messages.push({
            type: shouldFormat ? "formatted" : "plaintext",
            message: text
        });
        const shouldScroll = wrap.scrollHeight - wrap.scrollTop - wrap.clientHeight < 1;
        if(shouldScroll || forceScroll) wrap.scrollTop = wrap.scrollHeight;
    }

    const chatter = new Chatter(addMessage);

    const onkeydown = (e: KeyboardEvent) => {
        e.stopPropagation();

        if(e.key.length === 1 && e.key.charCodeAt(0) >= 256) {
            e.preventDefault();
            return;
        }

        if(e.key === "Enter") {
            e.preventDefault();
            sending = true;
            chatter.send(inputText).then(async () => {
                sending = false;
                await tick();
                input.focus();
            });
            inputText = "";
            return;
        }

        if(e.key === "Escape") {
            input.blur();
            chatter.stopTyping();
            return;
        }

        chatter.sendTyping();
    };
</script>

<div class="gl-chat">
    <div class="chat-spacer"></div>
    <div bind:this={wrap} class="chat-messages-wrap">
        <div class="chat-messages">
            {#each messages as message}
                <div>
                    {#if message.type === "formatted"}
                        {@html message.message}
                    {:else}
                        {message.message}
                    {/if}
                </div>
            {/each}
        </div>
        <div class="typing-text">{globals.playersTypingText}</div>
    </div>
    <input
        bind:this={input}
        bind:value={inputText}
        {onkeydown}
        onblur={() => {
            if(sending) return;
            chatter.stopTyping();
        }}
        maxlength={1000}
        placeholder={inputPlaceholder}
        disabled={sending || !globals.enabled}
    >
</div>

<style>
    .gl-chat {
        position: fixed;
        background-color: rgba(0, 0, 0, 0.3);
        transition: background 0.5s;
        bottom: 15vh;
        left: 15px;
        width: 350px;
        z-index: 50;
        min-height: 300px;
        display: flex;
        flex-direction: column;
    }

    .chat-spacer {
        flex-grow: 1;
    }

    .chat-messages-wrap {
        max-height: 400px;
        overflow-y: auto;
        scrollbar-color: rgba(255, 255, 255, 0.5) transparent;
    }

    .chat-messages {
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        color: white;
        padding: 5px;
    }

    .typing-text {
        padding-left: 5px;
        height: 1.5rem;
        color: white;
        font-size: small;
    }

    .gl-chat input {
        width: 100%;
        border: none;
    }
</style>
