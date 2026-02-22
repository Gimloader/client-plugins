/**
 * @name KitTimesPlayed
 * @description Shows the number of times that kits have been played on the kits screen
 * @author retrozy
 * @version 0.1.2
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/KitTimesPlayed.js
 * @webpage https://gimloader.github.io/plugins/KitTimesPlayed
 * @reloadRequired notingame
 * @changelog Updated webpage url
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

// plugins/KitTimesPlayed/src/index.ts
api.rewriter.addParseHook("Container", (code) => {
  if (!code.includes("There are no kits in this folder.")) return code;
  const name = getSection(code, ".createdAt?`Created ${#(@.");
  const playCountString = `${name}.playCount`;
  const playCountInfo = `, \${${playCountString} ? \`played \${${playCountString}} \${${playCountString} === 1 ? "time" : "times"}\` : "never played"}`;
  const isEnabledString = `GL.plugins.isEnabled("KitTimesPlayed")`;
  return insert(code, ".createdAt).fromNow()}@`", `\${${isEnabledString} ? \`${playCountInfo}\` : ""}`);
});
api.onStop(() => {
  if (location.pathname !== "/kits" && location.pathname !== "/gamemode") return;
  const kits = document.getElementsByClassName("ant-card ant-card-bordered ant-card-hoverable");
  for (const kit of kits) {
    const div = kit.children[0]?.children[0]?.children[0]?.children[1]?.children[1];
    if (!div?.innerHTML.includes(",")) return;
    div.innerHTML = div.innerHTML.split(",")[0];
  }
});
