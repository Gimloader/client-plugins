/**
 * @name GamemodeLinks
 * @description Creates game rooms from links, particularly useful in bookmarks.
 * @author retrozy
 * @version 0.3.0
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/plugins/GamemodeLinks.js
 * @webpage https://gimloader.github.io/plugins/gamemodelinks
 * @reloadRequired notingame
 * @hasSettings true
 * @changelog Reload required only while not in-game
 * @changelog Added links for editing a creative map. You can get a link for editing a specific map in the three dots on your maps
 * @changelog Added settings for if the gamemode selector should be updating the tab link and title
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
function replaceSection(code, match, replacement) {
  const { startIndex, endIndex } = getRange(code, match);
  const start = code.slice(0, startIndex);
  const end = code.slice(endIndex);
  return start + replacement + end;
}
function insert(code, match, string) {
  const { endIndex } = getRange(code, match);
  const start = code.slice(0, endIndex);
  const end = code.slice(endIndex);
  return start + string + end;
}

// plugins/GamemodeLinks/src/makeGame.ts
var matchmakerOptions = {
  group: "",
  joinInLate: true
};
async function makeGame(id2, entries) {
  if (!id2) throw new Error("Gamemode ID is missing");
  const hooksRes = await fetch("/api/experience/map/hooks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ experience: id2 })
  });
  const hooksJson = await hooksRes.json();
  if (hooksJson.name === "CastError") throw new Error("Invalid gamemode");
  if (hooksJson.message?.text) {
    const gameRes = await fetch("/api/matchmaker/intent/map/edit/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mapId: id2 })
    });
    if (gameRes.status === 500) throw new Error("This map doesn't exist.");
    return await gameRes.text();
  }
  const { hooks } = hooksJson;
  const defaultHooks = {};
  for (const hook of hooks) {
    if (hook.type === "selectBox") {
      defaultHooks[hook.key] = hook.options.defaultOption;
    } else if (hook.type === "number") {
      defaultHooks[hook.key] = hook.options.defaultValue;
    }
  }
  const savedHooksString = localStorage.getItem("gimkit-hook-saved-options");
  const savedHooks = savedHooksString ? JSON.parse(savedHooksString) : {};
  const urlHooks = {};
  for (const [key, value] of entries) {
    if (key === "joinInLate" || key === "useRandomNamePicker") {
      matchmakerOptions[key] = value !== "0" && value.toLowerCase() !== "false" && value.toLowerCase() !== "no";
    }
    const hook = hooks.find((hook2) => hook2.key === key);
    if (!hook) continue;
    if (hook.type === "selectBox") {
      if (!hook.options.options.includes(value)) {
        throw new Error(`"${value}" is not an option of ${hook.key}. The available options are: ${hook.options.options.join(", ")}.`);
      }
      urlHooks[key] = value;
    } else if (hook.type === "number") {
      const numberHook = Number(value);
      if (Number.isNaN(numberHook)) throw new Error(`${key} requires a number`);
      urlHooks[key] = numberHook;
    }
  }
  const body = {
    experienceId: id2,
    matchmakerOptions,
    options: {
      allowGoogleTranslate: false,
      cosmosBlocked: false,
      hookOptions: {
        ...defaultHooks,
        ...savedHooks[id2],
        ...urlHooks
      }
    }
  };
  const kitHook = hooks.find((hook) => hook.type === "kit");
  if (kitHook) {
    if (!api.settings.kit) {
      const meRes = await fetch("/api/games/summary/me");
      const { games } = await meRes.json();
      if (!games.length) throw new Error("You don't have any kits");
      api.settings.kit = games[0]._id;
    }
    body.options.hookOptions[kitHook.key] = api.settings.kit;
  }
  const creationRes = await fetch("/api/matchmaker/intent/map/play/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (creationRes.status === 500) throw new Error("This map doesn't exist, or you had invalid search parameters");
  return await creationRes.text();
}

// plugins/GamemodeLinks/src/index.ts
var copyUrlWrapper = api.rewriter.createShared("CopyURLWrapper", (id2) => {
  navigator.clipboard.writeText(`${location.origin}/gamemode/${id2}`);
});
api.rewriter.addParseHook("App", (code) => {
  if (!code.includes("Note that deleting a map will also remove it from Creative Discovery")) return code;
  let linkItem = getSection(code, "{menu:{items:[@,{key:`delete");
  const idString = getSection(linkItem, "rename-${@}");
  linkItem = linkItem.replace("rename", "link");
  linkItem = linkItem.replace("Rename", "Copy Edit Link");
  linkItem = linkItem.replace("fa-edit", "fa-link");
  linkItem = replaceSection(linkItem, ".stopPropagation(),@}", `${copyUrlWrapper}?.(${idString})`);
  return insert(code, "danger:!0,onClick:#()}}@#", `,${linkItem}`);
});
var setLink = (path) => history.pushState({}, "", path);
var { pathname } = location;
var { title } = document;
function cleanup() {
  setLink(pathname);
  document.title = title;
}
var [root, id] = location.pathname.split("/").slice(1);
if (root === "gamemode") {
  makeGame(id, new URLSearchParams(location.search).entries()).then((gameId) => {
    location.href = `/host?id=${gameId}`;
  }).catch((err) => alert(err.message));
} else {
  fetch("/api/games/summary/me").then((res) => res.json()).then(({ games }) => {
    api.settings.create([
      {
        type: "dropdown",
        id: "kit",
        title: "Kit",
        description: "Which kit should be used when starting a game from a link?",
        options: games.map((g) => ({ label: g.title, value: g._id }))
      },
      {
        id: "updateLink",
        type: "toggle",
        title: "Update Tab Link",
        description: "If the tab link text should be updated to the gamemode link when using the gamemode selector",
        default: true,
        onChange(enabled) {
          if (!enabled) cleanup();
        }
      },
      {
        id: "updateTitle",
        type: "toggle",
        title: "Update Tab Title",
        description: "If the tab title should be updated to the gamemode name using the gamemode selector",
        default: true,
        onChange(enabled) {
          if (!enabled) cleanup();
        }
      }
    ]);
  }, console.error);
  api.net.modifyFetchResponse("**/create", cleanup);
  api.onStop(() => {
    if (location.pathname.startsWith("/gamemode")) cleanup();
  });
}
var setHooksWrapper = api.rewriter.createShared("SetHooksWrapper", (hooks) => {
  if (!api.settings.updateLink) return;
  hooks = { ...hooks };
  const kitKey = Object.keys(hooks).find((hook) => hook.toLowerCase().includes("kit"));
  if (kitKey) delete hooks[kitKey];
  for (const key in hooks) {
    if (typeof hooks[key] === "number") {
      hooks[key] = hooks[key].toString();
    }
  }
  const searchParams = new URLSearchParams(hooks);
  const newLink = `?${searchParams.toString()}`;
  if (location.search === newLink) return;
  setLink(newLink);
});
var setMapDataWrapper = api.rewriter.createShared("SetMapDataWrapper", (id2, name) => {
  if (api.settings.updateLink) {
    const path = location.pathname.split("/");
    if (path[1] !== "gamemode") {
      pathname = location.pathname;
      title = document.title;
    }
    if (path[2] === id2) return;
    setLink("/gamemode/" + id2 + location.search);
  }
  if (api.settings.updateTitle) {
    document.title = name;
  }
});
var closePopupWrapper = api.rewriter.createShared("ClosePopupWrapper", cleanup);
api.rewriter.addParseHook("App", (code) => {
  if (code.includes("We're showing this hook for testing purposes")) {
    const name = getSection(code, "state:@,");
    return insert(code, ".readOnly]);@#", `${setHooksWrapper}?.(${name});`);
  } else if (code.includes("The more reliable, the easier it is for crewmates to win")) {
    const gameVarName = getSection(code, ".name,description:@.");
    code = insert(code, ")=>{const[#=()=>{@#", `${closePopupWrapper}?.();`);
    return insert(code, '"EXPERIENCE_HOOKS"})@}', `;${setMapDataWrapper}?.(${gameVarName}?._id, ${gameVarName}?.name);`);
  }
  return code;
});
