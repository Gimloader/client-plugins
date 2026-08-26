import { downloadFile, readFile } from "$shared/files";

function error(message: string) {
    api.UI.notification.error({ message });
}

function getBlockJson() {
    const deviceEditing = api.stores.me.editing.device;
    const deviceId = deviceEditing.currentlyEditedDevice.id;
    const gridId = deviceEditing.currentlyEditedGridId;
    if(!deviceId || !gridId) return error("Could not detect a currently edited block");

    const codeGrids = api.stores.world.devices.codeGrids;
    const json = codeGrids.get(deviceId)?.items?.get(gridId)?.json;
    if(!json) return error("Could not find a currently edited block");

    return json;
}

function downloadBlocks() {
    const json = getBlockJson();
    if(!json) return;

    downloadFile(json, "block.json", "application/json");
}

async function copyBlocks() {
    const json = getBlockJson();
    if(!json) return;

    try {
        await navigator.clipboard.writeText(json);
        api.UI.notification.success({ message: "Copied block code to clipboard" });
    } catch (e) {
        api.logger.error("Failed to write to clipboard", e);
        error("Failed to write to clipboard");
    }
}

async function setBlockJson(json: string) {
    try {
        JSON.parse(json);
    } catch (e) {
        api.logger.error("Failed to parse json", e);
        return error("Failed to parse block json");
    }

    const deviceEditing = api.stores.me.editing.device;
    const deviceId = deviceEditing.currentlyEditedDevice.id;
    const gridId = deviceEditing.currentlyEditedGridId;
    if(!deviceId || !gridId) return error("Could not detect a currently edited block");

    try {
        const unsub = api.net.colyseus.state.world.devices.codeGrids.get(deviceId)?.items.get(gridId)?.listen("json", () => {
            api.UI.forceReactUpdate();
            clearTimeout(updateTimeout);
            unsub();
        }, false);

        const updateTimeout = setTimeout(() => {
            api.logger.warn("Code grid failed to update after 2 seconds");
            unsub();
        }, 2000);

        api.net.colyseus.send("JOIN_CODE_GRID", {
            deviceId,
            gridId
        });

        api.net.colyseus.send("SET_CODE_GRID_JSON", {
            deviceId,
            gridId,
            json
        });
    } catch (e) {
        api.logger.error("Failed to read json", e);
    }
}

async function uploadBlocks() {
    const file = await readFile(".json");
    const json = await file.text();
    setBlockJson(json);
}

async function pasteBlocks() {
    try {
        const text = await navigator.clipboard.readText();
        setBlockJson(text);
    } catch (e) {
        api.logger.error("Failed to read from clipboard", e);
        error("Failed to read from clipboard");
    }
}

api.commands.addCommand({
    text: "SaveBlockCode: Download current block"
}, downloadBlocks);

api.commands.addCommand({
    text: "SaveBlockCode: Load block from file",
    keywords: ["upload"]
}, uploadBlocks);

api.commands.addCommand({
    text: "SaveBlockCode: Copy current block"
}, copyBlocks);

api.commands.addCommand({
    text: "SaveBlockCode: Paste to current block"
}, pasteBlocks);
