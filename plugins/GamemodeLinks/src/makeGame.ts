type HooksObj = Record<string, string | number>;

const matchmakerOptions: Record<string, any> = {
    group: "",
    joinInLate: true
};

export default async function makeGame(id: string, entries: URLSearchParamsIterator<[string, string]>) {
    if(!id) throw new Error("Gamemode ID is missing");

    // Hooks are hieratrical: map defaults -> your saved hooks -> URL hooks
    const hooksRes = await fetch("/api/experience/map/hooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ experience: id })
    });
    const hooksJson = await hooksRes.json();

    if(hooksJson.name === "CastError") throw new Error("Invalid gamemode");
    if(hooksJson.message?.text) {
        const gameRes = await fetch("/api/matchmaker/intent/map/edit/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mapId: id })
        });

        if(gameRes.status === 500) throw new Error("This map doesn't exist.");

        return await gameRes.text();
    }

    const { hooks } = hooksJson;

    const defaultHooks: HooksObj = {};
    for(const hook of hooks) {
        if(hook.type === "selectBox") {
            defaultHooks[hook.key] = hook.options.defaultOption;
        } else if(hook.type === "number") {
            defaultHooks[hook.key] = hook.options.defaultValue;
        }
    }

    const savedHooksString = localStorage.getItem("gimkit-hook-saved-options");
    const savedHooks = savedHooksString ? JSON.parse(savedHooksString) : {};

    const urlHooks: HooksObj = {};
    for(const [key, value] of entries) {
        if(key === "joinInLate" || key === "useRandomNamePicker") {
            matchmakerOptions[key] = value !== "0"
                && value.toLowerCase() !== "false"
                && value.toLowerCase() !== "no";
        }

        const hook = hooks.find((hook: any) => hook.key === key);
        if(!hook) continue;

        if(hook.type === "selectBox") {
            if(!hook.options.options.includes(value)) {
                throw new Error(`"${value}" is not an option of ${hook.key}. The available options are: ${hook.options.options.join(", ")}.`);
            }
            urlHooks[key] = value;
        } else if(hook.type === "number") {
            // Not validating ranges since they are only client side (see UncappedSettings)
            const numberHook = Number(value);
            if(Number.isNaN(numberHook)) throw new Error(`${key} requires a number`);
            urlHooks[key] = numberHook;
        }
    }

    const body = {
        experienceId: id,
        matchmakerOptions,
        options: {
            allowGoogleTranslate: false,
            cosmosBlocked: false,
            hookOptions: {
                ...defaultHooks,
                ...savedHooks[id],
                ...urlHooks
            }
        }
    };

    const kitHook = hooks.find((hook: any) => hook.type === "kit");
    if(kitHook) {
        if(!api.settings.kit) {
            const meRes = await fetch("/api/games/summary/me");
            const { games } = await meRes.json();

            if(!games.length) throw new Error("You don't have any kits");
            api.settings.kit = games[0]._id;
        }

        body.options.hookOptions[kitHook.key] = api.settings.kit;
    }

    const creationRes = await fetch("/api/matchmaker/intent/map/play/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    if(creationRes.status === 500) throw new Error("This map doesn't exist, or you had invalid search parameters");

    return await creationRes.text();
}
