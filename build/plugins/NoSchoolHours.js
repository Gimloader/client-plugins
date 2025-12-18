/**
 * @name NoSchoolHours
 * @description Bypasses the discovery page school hours
 * @author retrozy
 * @version 0.1.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/NoSchoolHours.js
 * @webpage https://gimloader.github.io/plugins/noschoolhours
 * @reloadRequired notingame
 */

// plugins/NoSchoolHours/src/index.ts
api.rewriter.addParseHook("App", (code) => {
  if (!code.includes("Discovery Is Closed During School Hours")) return code;
  const beforeVarIndex = code.indexOf("()&&") + 4;
  const afterVarIndex = code.indexOf("?", beforeVarIndex);
  const start = code.slice(0, beforeVarIndex);
  const end = code.substring(afterVarIndex);
  return start + "false" + end;
});
