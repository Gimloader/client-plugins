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

    api.net.on("send:INPUT", (_, editFn) => {
        // Allow movement when in the creative editor
        if(api.stores.session.version === "saved" && api.stores.session.phase === "preGame") return;
        editFn(null)
    });
});
