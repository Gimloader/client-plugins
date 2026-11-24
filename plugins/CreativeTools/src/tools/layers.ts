const dragChangeCallbacks = new Set<() => void>();
let draggingDevice: string | null = null;

api.rewriter.exposeVar("App-", {
    check: "Move To Primary Layer",
    find: /DevicesUnderCharacters\)\)}\),\w{1,3}},(\w{1,3})=/,
    callback: (component) => {
        api.patcher.afterReact(component.type, (_, args, returnVal) => {
            const buttons = returnVal.props.children[1].props.children;
            const newButton = api.React.cloneElement(buttons[0]) as any;
            const newIcon = api.React.cloneElement(newButton.props.icon) as any;

            newIcon.props.name = "fas fa-grip-vertical";
            newButton.props.icon = newIcon;
            newButton.props.onClick = (e: MouseEvent) => e.stopPropagation();
            newButton.props.onMouseDown = () => {
                draggingDevice = args[0].deviceId;
                document.body.style.cursor = "ns-resize";
                for(const callback of dragChangeCallbacks) callback();
            };
            newButton.props.style = { cursor: "ns-resize" };
            newButton.props.disabled = false;
            buttons.push(newButton);

            returnVal.props.children = api.React.createElement(layerWrapper, {
                deviceId: args[0].deviceId,
                children: returnVal.props.children
            });
        });
    }
});

api.rewriter.exposeVar("App-", {
    check: "Move To Primary Layer",
    find: /},(\w{1,3})=\w{1,3}=>{let{token:{/,
    callback: (component) => {
        api.patcher.afterReact(component, (_, args, returnVal) => {
            const children = returnVal.props.children;
            if(children?.[2]?.props?.style?.borderRadius !== 6) return;

            let layer = "DevicesAboveCharacters";
            if(args[0].layerName === "Below") layer = "DevicesUnderCharacters";
            else if(args[0].layerName === "Primary") layer = "DepthSortedCharactersAndDevices";

            children[2] = api.React.createElement(emptyLayerWrapper, {
                layer,
                children: children[2]
            });
        });
    }
});

let moveDeviceLayer: (deviceId: string, layerId: string) => void;
let moveDeviceUp: (deviceId: string, sortingState: Gimloader.Stores.SortingState[]) => void;
let moveDeviceDown: (deviceId: string, sortingState: Gimloader.Stores.SortingState[]) => void;
api.rewriter.exposeVar("App-", {
    check: "Move To Primary Layer",
    find: /\(\)=>(\w{1,3})\(\w{1,3}\.deviceId,/,
    callback: (func) => moveDeviceLayer = func
});

api.rewriter.exposeVar("App-", {
    check: "Move To Primary Layer",
    find: /DepthSortedCharactersAndDevices:null,(\w{1,3})=\(/,
    callback: (func) => moveDeviceUp = func
});

api.rewriter.exposeVar("App-", {
    check: "Move To Primary Layer",
    find: /\.y}\),.{1,7}\)},(\w{1,3})=\(/,
    callback: (func) => moveDeviceDown = func
});

// setTimeout needed since this fires before the other mouseUp listeners
const onMouseUp = () => {
    if(!draggingDevice) return;

    draggingDevice = null;
    document.body.style.cursor = "";
    for(const callback of dragChangeCallbacks) callback();
};

window.addEventListener("pointerup", onMouseUp);
api.onStop(() => window.removeEventListener("pointerup", onMouseUp));

function emptyLayerWrapper({ layer, children }: { layer: string; children: any }) {
    const [_, forceUpdate] = api.React.useReducer((x) => x + 1, 0);
    const [hovered, setHovered] = api.React.useState(false);

    api.React.useEffect(() => {
        dragChangeCallbacks.add(forceUpdate);
        return () => void dragChangeCallbacks.delete(forceUpdate);
    }, []);

    return api.React.createElement("div", {
        className: draggingDevice && hovered ? "border-inside-white" : "",
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
        onPointerUp: () => {
            if(!draggingDevice || !hovered) return;
            moveDeviceLayer(draggingDevice, layer);
        }
    }, children);
}

function layerWrapper({ deviceId, children }: { deviceId: string; children: any }) {
    const [_, forceUpdate] = api.React.useReducer((x) => x + 1, 0);
    const [hoverSide, setHoverSide] = api.React.useState<string | null>(null);

    const isBeingDragged = draggingDevice === deviceId;

    api.React.useEffect(() => {
        dragChangeCallbacks.add(forceUpdate);
        return () => void dragChangeCallbacks.delete(forceUpdate);
    }, []);

    return api.React.createElement("div", {
        style: {
            display: "flex",
            width: "100%",
            alignItems: "center",
            opacity: isBeingDragged ? 0.5 : 1,
            borderTop: hoverSide === "top" && !isBeingDragged && draggingDevice !== null ? "2px solid white" : "",
            borderBottom: hoverSide === "bottom" && !isBeingDragged && draggingDevice !== null ? "2px solid white" : ""
        },
        onMouseMove: (e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseY = e.clientY - rect.top;
            const side = mouseY < rect.height / 2 ? "top" : "bottom";
            setHoverSide(side);
        },
        onMouseLeave: () => setHoverSide(null),
        onPointerUp: () => {
            if(!draggingDevice || isBeingDragged || !hoverSide) return;
            moveDevice(draggingDevice, deviceId, hoverSide);
        }
    }, children);
}

async function moveDevice(movingId: string, deviceId: string, side: string) {
    const sortingState = api.stores.me.editing.device.sortingState;
    const dragged = sortingState.find(d => d.deviceId === movingId);
    const device = sortingState.find(d => d.deviceId === deviceId);
    if(!dragged || !device) return;

    if(dragged.layer !== device.layer) {
        moveDeviceLayer(movingId, device.layer);

        // cullDevices forces the sortingState to update
        api.stores.phaser.scene.worldManager.devices.cullDevices();
    }

    // Exit after 5000 times just in case
    for(let i = 0; i < 5000; i++) {
        const layerDevices = sortingState.filter(d => d.layer === device.layer);
        const deviceIndex = layerDevices.findIndex(d => d.deviceId === deviceId);
        const desiredIndex = side === "top" ? deviceIndex - 1 : deviceIndex + 1;
        const draggedIndex = layerDevices.findIndex(d => d.deviceId === movingId);
        if(draggedIndex === desiredIndex) break;

        if(draggedIndex < desiredIndex) moveDeviceDown(movingId, sortingState);
        else moveDeviceUp(movingId, sortingState);
    }
}
