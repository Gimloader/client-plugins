// Not putting fetch types here until gimloader documents them

import minifiedNavigator from "$shared/minifiedNavigator";
import makeGame from "./makeGame";

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
                }
            ]);
        }, console.error);

    const setLink = (path: string) => history.pushState({}, "", path);

    type Hooks = Record<string, string | number>;

    let { pathname } = location, { title } = document;

    function cleanup() {
        setLink(pathname);
        document.title = title;
    }

    const setHooksWrapper = api.rewriter.createShared("SetHooksWrapper", (hooks: Hooks) => {
        hooks = { ...hooks };

        // Gimkit uses "kit", "kitId", and "Kit ID".
        // Todo: once interceptor is added, intercept the hooks endpoint and find the hook name that has type "kit"
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
        const path = location.pathname.split("/");
        if(path[1] !== "gamemode") {
            pathname = location.pathname;
            title = document.title;
        }
        if(path[2] === id) return;

        document.title = name;
        setLink("/gamemode/" + id + location.search);
    });

    const closePopupWrapper = api.rewriter.createShared("ClosePopupWrapper", cleanup);

    // Creating games will close the popup
    api.net.modifyFetchResponse("**/create", cleanup);

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

    api.onStop(() => {
        if(location.pathname.startsWith("/gamemode")) cleanup();
    });
}
