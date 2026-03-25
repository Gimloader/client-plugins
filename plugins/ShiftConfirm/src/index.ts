// @ts-expect-error Types have not been updated yet
api.UI.onComponentLoad("modal", (modal) => {
    const originalConfirm = modal.confirm;
    // @ts-expect-error
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
