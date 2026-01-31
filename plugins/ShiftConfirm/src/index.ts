import type { Modal } from "antd";

api.rewriter.exposeVar(true, {
    find: /(\S+)\.useModal=\S+;\1\.info=function/,
    callback(modal: typeof Modal) {
        const originalConfirm = modal.confirm;
        modal.confirm = (props) => {
            if(api.hotkeys.pressed.has("ShiftLeft")) {
                props.onOk?.();

                return {
                    destroy() {},
                    update() {}
                };
            } else {
                return originalConfirm(props);
            }
        };

        api.onStop(() => {
            modal.confirm = originalConfirm;
        });
    }
});
