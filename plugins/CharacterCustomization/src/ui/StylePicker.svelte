<script lang="ts">
    import type { Category } from "../types";
    const Popover = api.Components.Popover;
    const ColorPicker = api.Components.ColorPicker;

    interface Props {
        categories: Category[];
    }

    let { categories }: Props = $props();
    let selection: Record<string, string> = $state({});

    for(const category of categories) {
        if(category.type === "color") {
            selection[category.name] = category.color.defaultColor;
        } else {
            selection[category.name] = category.options[0].name;
        }
    }

    export function getSelection() {
        return $state.snapshot(selection);
    }
</script>

{#each categories as category}
    <h3>{category.name}</h3>
    {#if category.type === "color"}
        <Popover.Root>
            <Popover.Trigger class="picker-wrapper">
                <div class="color-picker" style:background-color={selection[category.name]}></div>
                <div>Select Color</div>
            </Popover.Trigger>
            <Popover.Content class="picker-popover">
                <ColorPicker bind:hex={selection[category.name]} isAlpha={false} isDialog={false} />
            </Popover.Content>
        </Popover.Root>
    {:else}
        <div class="colors">
            {#each category.options as option}
                <button
                    title={option.name}
                    style:background-color={option.preview.color}
                    class:selected={selection[category.name] === option.name}
                    onclick={() => selection[category.name] = option.name}
                >
                </button>
            {/each}
        </div>
    {/if}
{/each}

<style>
    h3 {
        font-weight: bold;
    }

    :global(.picker-wrapper) {
        background-color: transparent;
        border: none;
        display: flex;
        align-items: center;
        cursor: pointer;
        gap: 6px;
    }

    :global(.picker-popover) {
        padding: 0px;
        width: auto;
        background-color: transparent;
        border: none;
        box-shadow: none;
    }

    .color-picker {
        border-radius: 9999px;
        width: 32px;
        height: 32px;
        border: 1px solid black;
    }

    .colors {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
    }

    .colors > button {
        width: 64px;
        height: 64px;
        border: none;
    }

    .colors > button.selected {
        border: 3px solid var(--primary-600);
    }
</style>
