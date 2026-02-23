/**
 * @name ConfirmClose
 * @description Ask for confirmation before closing the tab when in-game
 * @author TheLazySquid
 * @version 1.0.1
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/ConfirmClose.js
 * @webpage https://gimloader.github.io/plugins/ConfirmClose
 * @changelog Updated webpage url
 */

// plugins/ConfirmClose/src/index.ts
api.net.onLoad(() => {
  const beforeUnload = (e) => {
    e.preventDefault();
  };
  window.addEventListener("beforeunload", beforeUnload);
  api.onStop(() => window.removeEventListener("beforeunload", beforeUnload));
});
