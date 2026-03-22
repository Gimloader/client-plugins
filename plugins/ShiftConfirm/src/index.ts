const originalConfirm = api.UI.modal.confirm;
api.patcher.swap(api.UI.modal, "confirm", (props) => {
    if(api.hotkeys.pressed.has("ShiftLeft")) {
        props.onOk?.();

        return {
            destroy() {},
            update() {}
        };
    } else {
        return originalConfirm(props);
    }
});
