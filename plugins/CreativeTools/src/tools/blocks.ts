import { downloadJsonFile, readJsonFile } from "$shared/files";
import { createCodeGrid } from "./import";

api.rewriter.exposeVar("App-", {
    find: /\.gridId}\)},\w{1,3}=\w{1,3}\(\),(\w{1,3})=/,
    check: "`Cannot create more",
    callback: (display) => {
        api.UI.forceReactUpdate();

        api.patcher.afterReact(display.type, (_, args, returnVal) => {
            const gridIds = Array.from<string>(args[0].codeGrids.keys());
            const deviceId = args[0].deviceId;
            const blocks = returnVal.props.children[1].props.children;

            for(let i = 0; i < blocks.length; i++) {
                const grid = api.stores.world.devices.codeGrids.get(deviceId)?.items.get(gridIds[i]);
                if(!grid || !grid.triggerValue) continue;

                const items = blocks[i].props.children.props.children.props.menu.items;
                items.push({
                    key: "edit-grid",
                    icon: "✏️",
                    label: "Edit block",
                    onClick: (e: any) => {
                        e.domEvent.stopPropagation();
                        renameBlock(deviceId, gridIds[i], grid);
                    }
                });

                items.push({
                    key: "download-grid",
                    icon: "⬇️",
                    label: "Download block",
                    onClick: (e: any) => {
                        e.domEvent.stopPropagation();
                        downloadBlock(gridIds[i], grid);
                    }
                });
            }
        });
    }
});

api.rewriter.exposeVar("App-", {
    find: /}.`:``},(.{1,3})=/,
    check: "`Cannot create more",
    callback: (blockOptions) => {
        api.patcher.afterReact(blockOptions, (_, args, returnVal) => {
            const buttons = returnVal.props.children[1].props.children;
            const newButton = api.React.cloneElement(buttons[0]) as any;
            newButton.props.label = "Import block (CreativeTools)";
            newButton.props.onClick = () => importBlock(args[0].deviceId);

            buttons.push(newButton);
        });
    }
});

async function renameBlock(deviceId: string, gridId: string, grid: Gimloader.Stores.CodeGridItem) {
    const newValue = await api.UI.prompt("Edit block channel", {
        text: "Enter a new channel for this block",
        defaultVal: grid.triggerValue
    });

    if(!newValue) return;
    const triggerType = grid.triggerType;

    api.net.colyseus.send("DELETE_CODE_GRID", { deviceId, gridId });
    await createCodeGrid(deviceId, grid.json, triggerType, newValue);
}

function downloadBlock(gridId: string, grid: Gimloader.Stores.CodeGridItem) {
    downloadJsonFile({
        triggerType: grid.triggerType,
        triggerValue: grid.triggerValue,
        json: grid.json
    }, `block-${gridId}.json`);
}

async function importBlock(deviceId: string) {
    try {
        const block = await readJsonFile();
        createCodeGrid(deviceId, block.json, block.triggerType, block.triggerValue);
    } catch (e) {
        api.logger.error("Failed to read block json", e);
        api.UI.toast.error("Could not read block data");
    }
}
