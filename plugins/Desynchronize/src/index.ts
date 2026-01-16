import Sync from "./sync";
export * as DLD from "./dld";

api.settings.create([
    {
        id: "dldLaserAction",
        type: "dropdown",
        options: [
            { label: "Respawn Character", value: "respawn" },
            { label: "Show Warning", value: "warn" },
            { label: "Ignore", value: "ignore" }
        ],
        title: "On hitting a laser in DLD",
        description: "What action should be taken when touching a laser in DLD?",
        default: "warn"
    },
    {
        id: "pluginSync",
        type: "toggle",
        title: "Plugin Sync",
        description: "Syncs your position (nothing else) to other players with this plugin and setting on. This requires the optional Communication library to be installed."
    }
]);

api.net.onLoad(() => {
    let allowNext = false;
    let firstPhase = true;

    // allow us to be moved when the game starts/stops
    api.onStop(api.net.room.state.session.listen("phase", () => {
        if(firstPhase) {
            firstPhase = false;
            return;
        }
        allowNext = true;
    }));

    api.net.on("PHYSICS_STATE", (_, editFn) => {
        if(allowNext) {
            allowNext = false;
            return;
        }
        editFn(null);
    });

    api.net.on("send:INPUT", (_, editFn) => editFn(null));
});

let sync: Sync | null = null;

function stopSync() {
    sync?.stop();
    sync = null;
}

api.settings.listen("pluginSync", (enabled) => {
    if(enabled) {
        if(api.libs.isEnabled("Communication")) {
            api.net.onLoad(() => {
                sync ??= new Sync();
            });
        } else {
            api.settings.pluginSync = false;
            api.UI.showModal(
                document.createElement("div"),
                {
                    title: "The Communication library is required for plugin sync.",
                    closeOnBackgroundClick: true,
                    style: "color: red"
                }
            );
        }
    } else {
        stopSync();
    }
}, true);

api.onStop(stopSync);
