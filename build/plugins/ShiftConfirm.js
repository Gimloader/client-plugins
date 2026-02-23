/**
 * @name ShiftConfirm
 * @description Makes confirm popups resolve instantly when holding shift.
 * @author retrozy
 * @version 0.1.1
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/ShiftConfirm.js
 * @webpage https://gimloader.github.io/plugins/ShiftConfirm
 * @changelog Updated webpage url
 */

// plugins/ShiftConfirm/src/index.ts
api.rewriter.exposeVar(true, {
  find: /(\S+)\.useModal=\S+;\1\.info=function/,
  callback(modal) {
    const originalConfirm = modal.confirm;
    modal.confirm = (props) => {
      if (api.hotkeys.pressed.has("ShiftLeft")) {
        props.onOk?.();
        return {
          destroy() {
          },
          update() {
          }
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
