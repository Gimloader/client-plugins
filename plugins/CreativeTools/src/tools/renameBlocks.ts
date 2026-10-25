import { createCodeGrid } from "./import";

api.rewriter.exposeVar("App-BZH0", {
    find: /ht/,
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
            }
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
