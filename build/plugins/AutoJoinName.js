/**
 * @name AutoJoinName
 * @description Automatically joins games with a configured name
 * @author retrozy
 * @version 0.1.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/AutoJoinName.js
 * @webpage https://gimloader.github.io/plugins/autojoinname
 * @hasSettings true
 */

// plugins/AutoJoinName/src/index.ts
api.settings.create([
  {
    id: "name",
    type: "text",
    title: "Name",
    description: "The name that is automatically joined with",
    maxLength: 20
  }
]);
var localStorageName = "play-again-last-used-name";
api.settings.listen("name", (name) => {
  localStorage.setItem(localStorageName, name);
}, true);
api.onStop(() => localStorage.removeItem(localStorageName));
