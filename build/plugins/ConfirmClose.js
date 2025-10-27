/**
 * @name ConfirmClose
 * @description Ask for confirmation before closing the tab when in-game
 * @author TheLazySquid
 * @version 1.0.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/ConfirmClose.js
 * @webpage https://gimloader.github.io/plugins/confirmclose
 */

// plugins/ConfirmClose/src/index.ts
api.net.onLoad(() => {
  const beforeUnload = (e) => {
    e.preventDefault();
  };
  window.addEventListener("beforeunload", beforeUnload);
  api.onStop(() => window.removeEventListener("beforeunload", beforeUnload));
});
