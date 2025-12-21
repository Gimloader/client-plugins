import minifiedNavigator from "$shared/minifiedNavigator";
import makeGame from "./makeGame";

type Hooks = Record<string, string | number>;

const copyUrlWrapper = api.rewriter.createShared("CopyURLWrapper", (id: string) => {
    navigator.clipboard.writeText(`${location.origin}/gamemode/${id}`);
});

api.rewriter.addParseHook("App", code => {
    if(!code.includes("Note that deleting a map will also remove it from Creative Discovery")) return code;

    // copy the rename item and morph it into a link item
    let linkItem = minifiedNavigator(code, "{menu:{items:[", ",{key:`delete").inBetween;
    const idString = minifiedNavigator(linkItem, "rename-${", "}").inBetween;
    linkItem = linkItem.replace("rename", "link");
    linkItem = linkItem.replace("Rename", "Copy Edit Link");
    linkItem = linkItem.replace("fa-edit", "fa-link");
    linkItem = minifiedNavigator(linkItem, ".stopPropagation(),", "}").replaceEntireBetween(`${copyUrlWrapper}?.(${idString})`);

    return minifiedNavigator(code, ["danger:!0,onClick:", "()}}"]).insertAfterStart(`,${linkItem}`);
});

const setLink = (path: string) => history.pushState({}, "", path);

let { pathname } = location, { title } = document;

function cleanup() {
    setLink(pathname);
    document.title = title;
}

const [root, id] = location.pathname.split("/").slice(1);

if(root === "gamemode") {
    makeGame(id, new URLSearchParams(location.search).entries())
        .then(gameId => {
            location.href = `/host?id=${gameId}`;
        })
        .catch((err: Error) => alert(err.message));
} else {
    fetch("/api/games/summary/me")
        .then(res => res.json())
        .then(({ games }) => {
            api.settings.create([
                {
                    type: "dropdown",
                    id: "kit",
                    title: "Kit",
                    description: "Which kit should be used when starting a game from a link?",
                    options: games.map((g: any) => ({ label: g.title, value: g._id }))
                },
                {
                    id: "updateLink",
                    type: "toggle",
                    title: "Update Tab Link",
                    description: "If the tab link text should be updated to the gamemode link when using the gamemode selector",
                    default: true,
                    onChange(enabled) {
                        if(!enabled) cleanup();
                    }
                },
                {
                    id: "updateTitle",
                    type: "toggle",
                    title: "Update Tab Title",
                    description: "If the tab title should be updated to the gamemode name using the gamemode selector",
                    default: true,
                    onChange(enabled) {
                        if(!enabled) cleanup();
                    }
                }
            ]);
        }, console.error);

    // Creating games will close the popup
    api.net.modifyFetchResponse("**/create", cleanup);

    api.onStop(() => {
        if(location.pathname.startsWith("/gamemode")) cleanup();
    });
}

const setHooksWrapper = api.rewriter.createShared("SetHooksWrapper", (hooks: Hooks) => {
    if(!api.settings.updateLink) return;
    hooks = { ...hooks };

    // Gimkit uses "kit", "kitId", and "Kit ID".
    const kitKey = Object.keys(hooks).find(hook => hook.toLowerCase().includes("kit"));
    if(kitKey) delete hooks[kitKey];

    for(const key in hooks) {
        if(typeof hooks[key] === "number") {
            hooks[key] = hooks[key].toString();
        }
    }

    const searchParams = new URLSearchParams(hooks as Record<string, string>);
    const newLink = `?${searchParams.toString()}`;
    if(location.search === newLink) return;
    setLink(newLink);
});

const setMapDataWrapper = api.rewriter.createShared("SetMapDataWrapper", (id: string, name: string) => {
    if(api.settings.updateLink) {
        const path = location.pathname.split("/");
        if(path[1] !== "gamemode") {
            pathname = location.pathname;
            title = document.title;
        }
        if(path[2] === id) return;
        setLink("/gamemode/" + id + location.search);
    }
    if(api.settings.updateTitle) {
        document.title = name;
    }
});

const closePopupWrapper = api.rewriter.createShared("ClosePopupWrapper", cleanup);

api.rewriter.addParseHook("App", code => {
    // Updates the hooks
    if(code.includes("We're showing this hook for testing purposes")) {
        const name = minifiedNavigator(code, "state:", ",").inBetween;
        // Updates the hooks
        return minifiedNavigator(code, ".readOnly]);").insertAfterStart(`${setHooksWrapper}?.(${name});`);
    } else if(code.includes("The more reliable, the easier it is for crewmates to win")) {
        const gameVarName = minifiedNavigator(code, ".name,description:", ".").inBetween;

        // Triggers manual popup closes
        code = minifiedNavigator(code, [")=>{const[", "{"]).insertAfterStart(`${closePopupWrapper}?.();`);
        // Updates the selected game
        return minifiedNavigator(code, '"EXPERIENCE_HOOKS"})').insertAfterStart(
            `;${setMapDataWrapper}?.(${gameVarName}?._id, ${gameVarName}?.name);`
        );
    }
    return code;
});
