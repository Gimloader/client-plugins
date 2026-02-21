<script lang="ts">
    import { onMount } from "svelte";
    import CosmeticChanger from "./cosmeticChanger";
    import { decompress } from "compress-json";

    let skinType = $state(CosmeticChanger.skinType);
    let skinId = $state(CosmeticChanger.skinId);
    let trailType = $state(CosmeticChanger.trailType);
    let trailId = $state(CosmeticChanger.trailId);
    let customSkinFile: File | null = $state(CosmeticChanger.customSkinFile);
    let selectedStyles: Record<string, string> = $state(CosmeticChanger.selectedStyles);

    function uploadSkin() {
        let input = document.createElement("input");
        input.type = "file";
        input.accept = ".png";

        input.onchange = () => {
            let file = input.files?.[0];
            if(!file) {
                customSkinFile = null;
            } else {
                customSkinFile = file;
            }
        };

        input.click();
    }

    let styles: any = $state();

    async function onSkinIdEntered() {
        styles = null;
        if(!skinId) return;

        let url = `https://www.gimkit.com/assets/map/characters/spine/${skinId}.json`;
        let res = await fetch(url);
        if(res.headers.get("content-type")?.startsWith("text/html")) {
            return;
        }

        let json = await res.json();
        let skinData = decompress(json);

        if(!skinData.style) return;
        styles = skinData.style;

        for(let style of styles.categories) {
            if(style.type === "color") {
                selectedStyles[style.name] = style.color.defaultColor;
            }
        }
    }

    export function save() {
        CosmeticChanger.setSkin(skinType, skinId, customSkinFile, selectedStyles);
        CosmeticChanger.setTrail(trailType, trailId);
    }

    onMount(onSkinIdEntered);
</script>

<h1>Skin</h1>
<div>
    <select bind:value={skinType}>
        <option value="default">Unchanged</option>
        <option value="id">Any skin by ID</option>
        <option value="custom">Custom</option>
    </select>
    {#if skinType === "id"}
        <input bind:value={skinId} type="text" placeholder="Skin ID" onchange={onSkinIdEntered} onkeydown={(e) => e.stopPropagation()} />
        {#if styles}
            {#each styles.categories as category}
                <h2>{category.name}</h2>
                {#if category.type === "color"}
                    <input type="color" bind:value={selectedStyles[category.name]} />
                {:else}
                    <div class="colors">
                        {#each category.options as option, i}
                            <button
                                class="color"
                                style:background-color={option.preview.color}
                                class:selected={selectedStyles[category.name] ? selectedStyles[category.name] === option.name : i === 0}
                                onclick={() => selectedStyles[category.name] = option.name}
                                title={option.name}
                            >
                            </button>
                        {/each}
                    </div>
                {/if}
            {/each}
        {/if}
    {:else if skinType === "custom"}
        <button onclick={uploadSkin}>
            Current: {customSkinFile ? customSkinFile.name : "None"}. Upload skin
        </button>
    {/if}
</div>

<h1>Trail</h1>
<div>
    <select bind:value={trailType}>
        <option value="default">Unchanged</option>
        <option value="id">Any trail by ID</option>
    </select>
    {#if trailType === "id"}
        <input bind:value={trailId} type="text" placeholder="Trail ID" />
    {/if}
</div>

<style>
    .colors {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        width: 100%;
        padding: 10px;
    }

    .color {
        width: 50px;
        height: 50px;
        border: none;
    }

    .color.selected {
        outline: 4px solid black;
    }
</style>
