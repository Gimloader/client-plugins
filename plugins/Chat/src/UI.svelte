<script lang="ts">
    import { tick } from "svelte";
    import Chatter from "./chatter";

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

    type Message = string | {
        skinId: string;
        text: string;
    };

    let messages = $state<Message[]>([]);
    let playersTypingText = $state("");
    let inputText = $state("");
    let enabled = $state(false);
    let sending = $state(false);
    let wrap: HTMLDivElement;
    let input: HTMLInputElement;

    let inputPlaceholder = $derived.by(() => {
        if(!enabled) return "Chat not available in lobby";
        if(sending) return "Sending...";
        return "...";
    });

    const shouldScroll = () => wrap.scrollHeight - wrap.scrollTop - wrap.clientHeight < 1;
    const scroll = () => {
        wrap.scrollTop = wrap.scrollHeight;
    };

    function addMessage(text: string, forceScroll = false) {
        if(format) text = format({ inputText: text });
        if(messages.length === 100) messages.splice(0, 1);
        messages.push(text);
        if(shouldScroll() || forceScroll) scroll();
    }

    function addPlayerMessage(skinId: string, text: string) {
        messages.push({ skinId, text });
        scroll();
    }

    const chatter = new Chatter(
        addMessage,
        addPlayerMessage,
        (text: string) => playersTypingText = text,
        (e: boolean) => enabled = e
    );
</script>

<div class="gl-chat">
    <div class="chat-spacer"></div>
    <div bind:this={wrap} class="chat-messages-wrap">
        <div class="chat-messages">
            {#each messages as message}
                <div class="flex">
                    {#if typeof message === "string"}
                        {@html message}
                    {:else}
                        <img
                            alt="Player"
                            width={25}
                            height={25}
                            src={`https://www.gimkit.com/assets/map/characters/spine/preview/${message.skinId}.png`}
                        >
                        <div>{message.text}</div>
                    {/if}
                </div>
            {/each}
        </div>
        <div class="typing-text">{playersTypingText}</div>
    </div>
    <input
        bind:this={input}
        bind:value={inputText}
        onkeydown={(e) => {
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
                e.currentTarget.blur();
                chatter.stopTyping();
                return;
            }

            chatter.sendTyping();
        }}
        onblur={() => {
            if(sending) return;
            chatter.stopTyping();
        }}
        maxlength={1000}
        placeholder={inputPlaceholder}
        disabled={sending || !enabled}
    >
</div>

<style>
    .flex {
        display: flex;
    }

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
