<script lang="ts">
    import { onDestroy } from "svelte";
    import CosmeticSelection from "../selection.svelte";
    import { getCustomSkinTexture, unloadSkinTextures } from "../skinLoader";
    const DropdownMenu = api.Components.DropdownMenu;
    const ContextMenu = api.Components.ContextMenu;

    onDestroy(() => unloadSkinTextures());
</script>

<h2>Gim</h2>
<div class="button-container">
    <div>
        <DropdownMenu.Root>
            <DropdownMenu.Trigger style="font-size: 50px" class="item-button">
                +
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
                <DropdownMenu.Item onclick={() => CosmeticSelection.addOfficialSkin()}>Official Gim</DropdownMenu.Item>
                <DropdownMenu.Item onclick={() => CosmeticSelection.addCustomSkin()}>Custom Gim</DropdownMenu.Item>
            </DropdownMenu.Content>
        </DropdownMenu.Root>
        New
    </div>
    <div>
        <button
            style="font-size: 32px"
            class="item-button"
            class:selected={!CosmeticSelection.skin}
            onclick={() => CosmeticSelection.unselectSkin()}
        >
            🗙
        </button>
        Unchanged
    </div>
    {#each CosmeticSelection.customSkins as name}
        <div>
            <ContextMenu.Root>
                <ContextMenu.Trigger>
                    <button
                        class="item-button"
                        class:selected={CosmeticSelection.skin?.type === "custom" && CosmeticSelection.skin.name === name}
                        onclick={() => CosmeticSelection.selectCustomSkin(name)}
                    >
                        {#await getCustomSkinTexture(name)}
                            <api.Components.Spinner stroke="black" />
                        {:then url}
                            <img src={url} alt="Custom gim" />
                        {/await}
                    </button>
                </ContextMenu.Trigger>
                <ContextMenu.Content>
                    <ContextMenu.Item onclick={() => CosmeticSelection.deleteCustomSkin(name)}>
                        Delete {name}
                    </ContextMenu.Item>
                </ContextMenu.Content>
            </ContextMenu.Root>
            {name}
        </div>
    {/each}
    {#each CosmeticSelection.pastSkins as skin}
        <div>
            <ContextMenu.Root>
                <ContextMenu.Trigger>
                    <button
                        class="item-button"
                        title="Select the gim {skin}"
                        class:selected={CosmeticSelection.skin?.type === "official" && CosmeticSelection.skin.id === skin.id}
                        onclick={() => CosmeticSelection.selectOfficialSkin(skin.id)}
                    >
                        <img src="https://www.gimkit.com/assets/map/characters/spine/preview/{skin.id}.png" alt="The gim {skin.id}" />
                        {#if skin.editStyles}
                            <span class="styles-indicator" title="Edit styles available">🎨</span>
                        {/if}
                    </button>
                </ContextMenu.Trigger>
                <ContextMenu.Content>
                    <ContextMenu.Item onclick={() => CosmeticSelection.deleteOfficialGim(skin.id)}>
                        Delete {skin.id}
                    </ContextMenu.Item>
                    {#if skin.editStyles}
                        <ContextMenu.Item onclick={() => CosmeticSelection.updateEditStyles(skin.id)}>
                            Update edit styles
                        </ContextMenu.Item>
                    {/if}
                </ContextMenu.Content>
            </ContextMenu.Root>
            {skin.id}
        </div>
    {/each}
</div>

<h2>Trail</h2>
<div class="button-container">
    <div>
        <button
            style="font-size: 50px"
            class="item-button"
            onclick={() => CosmeticSelection.addTrail()}
        >
            +
        </button>
        New
    </div>
    <div>
        <button
            style="font-size: 32px"
            class="item-button"
            class:selected={!CosmeticSelection.trail}
            onclick={() => CosmeticSelection.unselectTrail()}
        >
            🗙
        </button>
        Unchanged
    </div>
    {#each CosmeticSelection.pastTrails as trail}
        <div>
            <ContextMenu.Root>
                <ContextMenu.Trigger>
                    <button
                        class="item-button"
                        title="Select the trail {trail}"
                        class:selected={CosmeticSelection.trail === trail}
                        onclick={() => CosmeticSelection.selectTrail(trail)}
                    >
                        <img src="https://www.gimkit.com/assets/map/trails/{trail}/preview.png" alt="The trail {trail}" />
                    </button>
                </ContextMenu.Trigger>
                <ContextMenu.Content>
                    <ContextMenu.Item onclick={() => CosmeticSelection.deleteTrail(trail)}>
                        Delete {trail}
                    </ContextMenu.Item>
                </ContextMenu.Content>
            </ContextMenu.Root>
            {trail}
        </div>
    {/each}
</div>

<style>
    h2 {
        font-weight: bold;
        border-bottom: 1px solid black;
    }

    .button-container {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
    }

    .button-container > div {
        text-align: center;
        font-size: 12px;
        width: 100px;
        overflow-wrap: break-word;
    }

    :global(.item-button) {
        width: 100px;
        height: 100px;
        background-color: var(--secondary);
        border-radius: 8px;
        border: 1px solid black;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        position: relative;
    }

    .item-button.selected {
        border: 3px solid var(--primary-600);
    }

    .item-button > img {
        width: 94px;
        height: 94px;
    }

    .styles-indicator {
        position: absolute;
        top: 4px;
        right: 4px;
    }
</style>
