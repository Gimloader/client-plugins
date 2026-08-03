api.UI.onComponentLoad("modal", (modal) => {
    const originalConfirm = modal.confirm;
    api.patcher.swap(modal, "confirm", (props) => {
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
});
