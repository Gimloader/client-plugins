import { mount, unmount } from "svelte";
import HideOptions from "../ui/HideOptions.svelte";

export interface HideState {
    aboveHidden: boolean;
    primaryHidden: boolean;
    belowHidden: boolean;
}

let hideState: HideState = Object.assign({
    aboveHidden: false,
    primaryHidden: false,
    belowHidden: false
}, api.storage.getValue("hideState", {}));

api.rewriter.exposeVar("App-", {
    check: "Eraser (Q)",
    find: /: flex-start;\n`,(\w{1,3})=/,
    callback: (component) => {
        api.patcher.afterReact(component.type, (_, __, returnVal) => {
            try {
                const buttons = returnVal.props.children[0].props.children[0].props.children.props.children;
                const newButton = api.React.cloneElement(buttons[1]) as any;
                const newIcon = api.React.cloneElement(newButton.props.children) as any;
                const newIconChild = api.React.cloneElement(newIcon.props.children) as any;
                newButton.props.children = newIcon;
                newIcon.props.children = newIconChild;

                newIcon.props.tooltip = "Device Visibility";
                newIcon.props.onClick = showHidingOptions;
                newIconChild.props.name = "fas fa-eye";
                buttons.push(newButton);
            } catch (e) {
                api.logger.error(e);
            }
        });
    }
});

function showHidingOptions() {
    const element = document.createElement("div");
    const options = mount(HideOptions, {
        target: element,
        props: {
            hideState,
            onChange: (newState: HideState) => {
                hideState = newState;
                api.storage.setValue("hideState", hideState);
                applyHideState();
            }
        }
    });

    api.UI.showModal(element, {
        id: "HideOptions",
        title: "Device Visibility Options",
        className: "preflight",
        style: "width: min(90%, 450px); height: min(90%, 325px);",
        onClosed: () => unmount(options),
        buttons: [
            {
                text: "Apply",
                style: "primary"
            }
        ]
    });
}

api.net.onLoad(() => {
    const devices = api.stores.phaser.scene.worldManager.devices;
    api.patcher.after(devices, "addDevice", (_, args) => {
        const device = args[0];
        updateDeviceHidden(device);
    });

    applyHideState();
});

function applyHideState() {
    for(const device of api.stores.phaser.scene.worldManager.devices.allDevices) {
        updateDeviceHidden(device);
    }
}

function updateDeviceHidden(device: Gimloader.Stores.Device) {
    let shouldHide = false;
    if(device.layers.layer === "DevicesAboveCharacters" && hideState.aboveHidden) shouldHide = true;
    else if(device.layers.layer === "DepthSortedCharactersAndDevices" && hideState.primaryHidden) shouldHide = true;
    else if(device.layers.layer === "DevicesUnderCharacters" && hideState.belowHidden) shouldHide = true;

    if(shouldHide) hideDevice(device);
    else showDevice(device);
}

function hideDevice(device: Gimloader.Stores.Device) {
    device.shadows.hide();
    device.parts.forceHide();
    device.colliders.hideDebug();
}

function showDevice(device: Gimloader.Stores.Device) {
    device.shadows.show();
    device.parts.forceShow();
    device.colliders.showDebug();
}
