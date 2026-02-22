/**
 * @name CrazyFlag
 * @description Make the flags in capture the flag or creative swing like crazy!
 * @author TheLazySquid
 * @version 1.3.2
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/CrazyFlag.js
 * @webpage https://gimloader.github.io/plugins/CrazyFlag
 * @hasSettings true
 * @changelog Updated webpage url
 */

// plugins/CrazyFlag/src/index.ts
var settings = api.settings.create([
  {
    type: "number",
    id: "swingSpeed",
    title: "Swing Speed",
    description: "1 = normal speed",
    default: 2,
    min: 0
  },
  {
    type: "number",
    id: "swingAmount",
    title: "Swing Amount",
    description: "1 = normal speed",
    default: 120,
    min: 0
  }
]);
var flagConsts = null;
function applySettings() {
  if (!flagConsts) return;
  flagConsts.FlagSwingInterval = 1 / settings.swingSpeed;
  flagConsts.FlagSwingAmplitude = settings.swingAmount / 10;
}
settings.listen("swingSpeed", applySettings);
settings.listen("swingAmount", applySettings);
api.rewriter.exposeVar("FlagDevice", {
  find: /(\w)={FlagOriginX/,
  callback: (consts) => {
    const defaults = Object.assign({}, consts);
    flagConsts = consts;
    applySettings();
    api.onStop(() => {
      if (!flagConsts) return;
      Object.assign(flagConsts, defaults);
    });
  }
});
