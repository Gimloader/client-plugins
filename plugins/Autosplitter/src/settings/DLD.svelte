<script lang="ts">
    import type { DLDData } from "../types";
    import { categories, DLDSplits } from "../constants";
    import FullGame from "./FullGame.svelte";
    import IlSettings from "./ILSettings.svelte";
    import DLDToggles from "./DLDToggles.svelte";

    let { data = $bindable() }: { data: DLDData } = $props();

    let category = $state(categories[0]);
    let mode = $state("Full Game");
</script>

<select bind:value={category}>
    {#each categories as category}
        <option value={category}>{category}</option>
    {/each}
</select>

<select bind:value={mode}>
    <option value="Full Game">Full Game</option>
    {#each DLDSplits as split, i}
        <option value={i}>{split}</option>
    {/each}
</select>

<!-- Lazy way to do it but I don't care -->
{#key mode}
    {#key category}
        {#if mode !== "Full Game"}
            <IlSettings bind:data {category} summit={parseInt(mode)} />
        {:else}
            <FullGame splits={DLDSplits} bind:data {category} />
        {/if}
    {/key}
{/key}

<hr>

<DLDToggles bind:data />
