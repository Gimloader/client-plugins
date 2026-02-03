/**
 * @name GameTimeMS
 * @description Allows millisecond precision in the game timer
 * @author retrozy
 * @version 0.1.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/main/build/plugins/GameTimeMS.js
 * @webpage https://gimloader.github.io/plugins/gametimems
 * @reloadRequired ingame
 * @hasSettings true
 */

// shared/rewritingUtils.ts
function getRange(code, match) {
  const snippets = [];
  let currentWord = "";
  for (const letter of match) {
    if (letter === "#") {
      snippets.push(currentWord);
      currentWord = "";
    } else if (letter === "@") {
      snippets.push(currentWord);
      currentWord = "";
      snippets.push("@");
    } else {
      currentWord += letter;
    }
  }
  snippets.push(currentWord);
  const matchIndex = snippets.indexOf("@");
  const snippetsBeforeMatch = snippets.slice(0, matchIndex);
  let startIndex = 0;
  for (const snippet of snippetsBeforeMatch) {
    startIndex = code.indexOf(snippet, startIndex) + snippet.length;
  }
  const snippetAfterMatch = snippets[matchIndex + 1];
  const endIndex = code.indexOf(snippetAfterMatch, startIndex);
  return {
    startIndex,
    endIndex
  };
}
function getSection(code, match) {
  const { startIndex, endIndex } = getRange(code, match);
  return code.slice(startIndex, endIndex);
}
function insert(code, match, string) {
  const { endIndex } = getRange(code, match);
  const start = code.slice(0, endIndex);
  const end = code.slice(endIndex);
  return start + string + end;
}

// plugins/GameTimeMS/src/index.ts
api.settings.create([
  {
    id: "decimals",
    type: "slider",
    title: "Decimal Amount",
    description: "Amount of decimals to show",
    min: 1,
    max: 3,
    step: 1,
    default: 1
  }
]);
var msToTime = api.rewriter.createShared("MSToTime", (ms) => {
  const minutes = Math.floor(ms / 6e4);
  const seconds = Math.floor(ms % 6e4 / 1e3);
  const fraction = (ms % 1e3 / 1e3).toFixed(api.settings.decimals).slice(2);
  return `${minutes}:${String(seconds).padStart(2, "0")}.${fraction}`;
});
api.rewriter.addParseHook("MapOptionsDevice", (code) => {
  const ms = getSection(code, "=Math.max(0,@/1e3");
  return insert(code, ".gameClockDuration=@#", `${msToTime}?.(${ms}) ?? `);
});
api.rewriter.addParseHook("EndOfGameWidgetDevice", (code) => {
  const ms = getSection(code, "=Math.max(0,@/1e3");
  return insert(code, "gameTimeLabel,gameTimeValue:@#", `${msToTime}?.(${ms}) ?? `);
});
