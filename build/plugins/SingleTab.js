/**
 * @name SingleTab
 * @description Opens gamemodes in the current tab instead of a new tab.
 * @author retrozy
 * @version 0.1.1
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/SingleTab.js
 * @webpage https://gimloader.github.io/plugins/SingleTab
 * @changelog Updated webpage url
 */

// plugins/SingleTab/src/index.ts
api.patcher.instead(window, "open", () => ({ location }));
