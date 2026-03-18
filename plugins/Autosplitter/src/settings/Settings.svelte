<script lang="ts">
    import type { DLDData, GamemodesData, SplitsData } from "../types";
    import { gamemodes } from "../constants";
    import { getGamemodeData } from "../util";
    import Dld from "./DLD.svelte";
    import Fishtopia from "./Fishtopia.svelte";
    import OneWayOut from "./OneWayOut.svelte";

    const { uploadJson, downloadJson } = api.lib("JSONTransfer");

    let activeTab = $state(gamemodes[0]);
    let dataObj: any = {};
    for(let gamemode of gamemodes) {
        dataObj[gamemode] = getGamemodeData(gamemode);
    }

    let data: GamemodesData = $state(dataObj);

    export function save() {
        for(let gamemode of gamemodes) {
            api.storage.setValue(`${gamemode}Data`, $state.snapshot(data[gamemode]));
        }
    }

    function exportAll() {
        let json: Record<string, Record<string, any>> = {};
        for(let gamemode of gamemodes) {
            let data = api.storage.getValue(`${gamemode}Data`);
            if(!data) continue;
            json[gamemode] = data;
        }

        downloadJson(json, "splits");
    }

    function importAll() {
        uploadJson<GamemodesData>()
            .then(([newData]) => {
                data = {
                    ...data,
                    ...newData
                };

                for(let gamemode of gamemodes) {
                    api.storage.setValue(`${gamemode}Data`, newData[gamemode]);
                }
            })
            .catch(() => {});
    }

    function exportMode() {
        let json = data[activeTab];
        downloadJson(json, `${activeTab}.json`);
    }

    function importMode() {
        uploadJson<DLDData | SplitsData>()
            .then(([newData]) => {
                (data[activeTab] as SplitsData) = newData;
                api.storage.setValue(`${activeTab}Data`, newData);
            })
            .catch(() => {});
    }
</script>

<div class="wrap">
    <div class="tabs">
        {#each gamemodes as tab}
            <button class="tab" class:active={activeTab === tab} onclick={() => activeTab = tab}>
                {tab}
            </button>
        {/each}
        <div class="actions">
            <button onclick={exportAll}>All &#11123;</button>
            <button onclick={importAll}>All &#11121;</button>
            <button onclick={exportMode}>Mode &#11123;</button>
            <button onclick={importMode}>Mode &#11121;</button>
        </div>
    </div>

    <div class="settings-content">
        {#if activeTab === "DLD"}
            <Dld bind:data={data.DLD!} />
        {:else if activeTab === "Fishtopia"}
            <Fishtopia bind:data={data.Fishtopia!} />
        {:else if activeTab === "OneWayOut"}
            <OneWayOut bind:data={data.OneWayOut!} />
        {/if}
    </div>
</div>

<style>
    .settings-content {
        max-height: calc(100% - 40px);
        overflow-y: auto;
    }

    .tabs {
        display: flex;
        padding-left: 10px;
        gap: 10px;
        border-bottom: 1px solid gray;
        height: 37px;
    }

    .tab {
        background-color: lightgray;
        border: 1px solid gray;
        border-bottom: none;
        border-radius: 10px;
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
    }

    .tab.active {
        background-color: white;
    }

    .actions {
        height: 100%;
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .actions button {
        margin: 6px 0;
        padding: 0 8px;
        height: 25px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-wrap: nowrap;
    }
</style>
