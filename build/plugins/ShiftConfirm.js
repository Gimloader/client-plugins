/**
 * @name ShiftConfirm
 * @description Makes confirm popups resolve instantly when holding shift.
 * @author retrozy
 * @version 0.1.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/ShiftConfirm.js
 * @webpage https://gimloader.github.io/plugins/shiftconfirm
 */

// plugins/ShiftConfirm/src/index.ts
var shiftHeld = false;
var keydown = (e) => {
  if (e.key === "Shift") shiftHeld = true;
};
var keyup = (e) => {
  if (e.key === "Shift") shiftHeld = false;
};
document.addEventListener("keydown", keydown);
document.addEventListener("keyup", keyup);
api.onStop(() => {
  document.removeEventListener("keydown", keydown);
  document.removeEventListener("keyup", keyup);
});
api.rewriter.exposeVar(true, {
  find: /(\S+)\.useModal=\S+;\1\.info=function/,
  callback(val) {
    const originalConfirm = val.confirm;
    val.confirm = (...args) => {
      const [{ onOk }] = args;
      if (shiftHeld) {
        onOk();
      } else {
        return originalConfirm(...args);
      }
    };
    api.onStop(() => {
      val.confirm = originalConfirm;
    });
  }
});
